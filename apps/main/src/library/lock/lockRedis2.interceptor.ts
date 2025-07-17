import {catchError, Observable, throwError} from 'rxjs'
import {map} from 'rxjs/operators'
import {REQ} from '@common/type'
import {ResponseBody} from '@common/interface'
import {CallHandler, ExecutionContext, HttpException, Injectable, NestInterceptor} from '@nestjs/common'
import {Reflector} from '@nestjs/core/services'
import {API_LOCK_MECHANISMS, LockConfig} from "@library/lock/lock";
import {CryptoUtil} from "@library/utils/crypt.util";
import {nanoid} from "nanoid";
import {RedisProvider} from "@library/redis";
import {Redis} from "@sophons/redis";
import {info} from "@common/config";

/**
 * Redis分布式锁拦截器 无错误处理版本
 * 相同的请求且数据相同的情况下，进行队列处理
 */
@Injectable()
export class LockRedis2Interceptor implements NestInterceptor {
    private redisClient: Redis;
    private readonly lockExpireTime = 30000; // 30秒锁过期时间
    private readonly lockRefreshInterval = 10000; // 10秒刷新一次锁过期时间
    private readonly waitTimeout = 60000 * 3; // 等待锁的最长时间（毫秒）
    private readonly pollInterval = 100; // 轮询间隔（毫秒）

    constructor(private reflector: Reflector) {
        // 初始化Redis客户端
        this.redisClient = RedisProvider.redisClient.client
    }

    public async intercept(ctx: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        // 从反射器中获取配置
        const cacheConfig = this.reflector.get<LockConfig>(API_LOCK_MECHANISMS, ctx.getHandler());
        if (!cacheConfig) {
            return next.handle();
        }

        const request: REQ = ctx.switchToHttp().getRequest();
        const {body, query} = request;

        // 构建锁的唯一标识
        let outKey = '';
        if(cacheConfig.isQuery){
            if(cacheConfig.isQuery instanceof Function){
                outKey += cacheConfig.isQuery(query) || "";
            }else{
                outKey += query ? JSON.stringify(query) : "";
            }
        }
        if(cacheConfig.isBody){
            if(cacheConfig.isBody instanceof Function){
                outKey += cacheConfig.isBody(body) || "";
            }else{
                outKey += body ? JSON.stringify(body) : "";
            }
        }
        if(cacheConfig.isUser){
            if(cacheConfig.isUser instanceof Function){
                outKey += cacheConfig.isUser(request['user']) || "";
            }else{
                outKey += request['user'] ? JSON.stringify(request['user']) : "";
            }
        }
        if(cacheConfig.req){
            outKey += cacheConfig.req(request) || "";
        }
        if(outKey.length > 0){
            outKey = CryptoUtil.hashing(outKey);
        }

        // 完整的锁键名
        const lockKey = `${info.appName}_${info.env}:lock:${cacheConfig.key}:${outKey}`;
        const queueKey = `${info.appName}_${info.env}:lockqueue:${cacheConfig.key}:${outKey}`;
        const requestId = nanoid(12); // 用于标识当前请求的唯一ID

        try {
            // 首先尝试获取锁
            const acquired = await this.acquireLock(lockKey, requestId);

            if (acquired) {
                // 获取锁成功，设置定时刷新
                const refreshInterval = setInterval(() => {
                    this.refreshLock(lockKey, requestId).catch(() => {
                        clearInterval(refreshInterval);
                    });
                }, this.lockRefreshInterval);

                return next.handle().pipe(
                    map((data: ResponseBody<any>) => {
                        clearInterval(refreshInterval);
                        // 处理完成后，释放锁并发布通知
                        this.finishProcessing(lockKey, requestId);
                        return data;
                    }),
                    catchError((err: HttpException) => {
                        clearInterval(refreshInterval);
                        // 错误处理后，也释放锁并发布通知
                        this.finishProcessing(lockKey, requestId);
                        return throwError(err);
                    })
                );
            } else {
                // 获取锁失败，将请求ID加入队列
                await this.redisClient.rpush(queueKey, requestId);

                // 等待轮到自己执行
                const isProcessed = await this.waitForTurn(lockKey, queueKey, requestId);

                if (!isProcessed) {
                    // 清理队列中的自己
                    await this.removeFromQueue(queueKey, requestId);
                    return throwError(new HttpException('操作超时请重试', 503));
                }

                // 设置刷新定时器
                const refreshInterval = setInterval(() => {
                    this.refreshLock(lockKey, requestId).catch(() => {
                        clearInterval(refreshInterval);
                    });
                }, this.lockRefreshInterval);

                return next.handle().pipe(
                    map((data: ResponseBody<any>) => {
                        clearInterval(refreshInterval);
                        this.finishProcessing(lockKey, requestId);
                        return data;
                    }),
                    catchError((err: HttpException) => {
                        clearInterval(refreshInterval);
                        this.finishProcessing(lockKey, requestId);
                        return throwError(err);
                    })
                );
            }
        } catch (error) {
            // 清理队列中的自己
            await this.removeFromQueue(queueKey, requestId);
            return throwError(new HttpException('锁操作失败', 503));
        }
    }

    /**
     * 从队列中移除请求ID
     */
    private async removeFromQueue(queueKey: string, requestId: string): Promise<void> {
        const script = `
            local count = redis.call('lrem', KEYS[1], 1, ARGV[1])
            return count
        `;
        await this.redisClient.eval(script, 1, queueKey, requestId);
    }

    /**
     * 等待轮到自己执行
     */
    private async waitForTurn(lockKey: string, queueKey: string, requestId: string): Promise<boolean> {
        const startTime = Date.now();

        while (Date.now() - startTime < this.waitTimeout) {
            // 检查是否已获得锁
            const currentHolder = await this.redisClient.get(lockKey);
            if (currentHolder === requestId) {
                return true;
            }

            // 检查队列头部是否是自己
            const queueHead = await this.redisClient.lindex(queueKey, 0);

            // 如果自己是队列头部并且锁可用，则尝试获取锁
            if (queueHead === requestId && !currentHolder) {
                const acquired = await this.acquireLock(lockKey, requestId);
                if (acquired) {
                    // 从队列中移除自己
                    await this.redisClient.lpop(queueKey);
                    return true;
                }
            }

            // 等待一段时间再次检查
            await new Promise(resolve => setTimeout(resolve, this.pollInterval));
        }

        return false; // 超时
    }

    /**
     * 处理完成后的操作
     */
    private async finishProcessing(lockKey: string, requestId: string): Promise<void> {
        // 释放锁
        await this.releaseLock(lockKey, requestId);
    }

    /**
     * 获取Redis分布式锁
     */
    private async acquireLock(lockKey: string, requestId: string): Promise<boolean> {
        const result = await this.redisClient.set(
            lockKey,
            requestId,
            'NX',
            'PX',
            this.lockExpireTime
        );
        return result === 'OK';
    }

    /**
     * 刷新锁过期时间
     */
    private async refreshLock(lockKey: string, requestId: string): Promise<void> {
        const script = `
            if redis.call("get", KEYS[1]) == ARGV[1] then
                return redis.call("pexpire", KEYS[1], ARGV[2])
            else
                return 0
            end
        `;
        await this.redisClient.eval(script, 1, lockKey, requestId, this.lockExpireTime);
    }

    /**
     * 释放Redis分布式锁
     */
    private async releaseLock(lockKey: string, requestId: string): Promise<void> {
        const script = `
            if redis.call("get", KEYS[1]) == ARGV[1] then
                return redis.call("del", KEYS[1])
            else
                return 0
            end
        `;
        await this.redisClient.eval(script, 1, lockKey, requestId);
    }
}

