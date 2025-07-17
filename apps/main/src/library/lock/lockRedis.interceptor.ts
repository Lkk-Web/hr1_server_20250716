import {catchError, Observable, throwError} from 'rxjs'
import {map} from 'rxjs/operators'
import {REQ} from '@common/type'
import {ResponseBody} from '@common/interface'
import {CallHandler, ExecutionContext, HttpException, Injectable, Logger, NestInterceptor} from '@nestjs/common'
import {Reflector} from '@nestjs/core/services'
import {API_LOCK_MECHANISMS, LockConfig} from "@library/lock/lock";
import {CryptoUtil} from "@library/utils/crypt.util";
import {nanoid} from "nanoid";
import {RedisProvider} from "@library/redis";
import {Redis} from "@sophons/redis";
import {info} from "@common/config";

/**
 * Redis分布式锁拦截器 有错误处理版本
 * 相同的请求且数据相同的情况下，进行队列处理
 */
@Injectable()
export class LockRedisInterceptor implements NestInterceptor {
    private redisClient: Redis;
    private readonly lockExpireTime = 30000; // 30秒锁过期时间
    private readonly lockRefreshInterval = 10000; // 10秒刷新一次锁过期时间
    private readonly waitTimeout = 60000 * 3; // 等待锁的最长时间（毫秒）
    private readonly pollInterval = 100; // 轮询间隔（毫秒）
    private readonly retryAttempts = 3; // 重试次数
    private readonly retryDelay = 1000; // 重试延迟（毫秒）
    private readonly logger = new Logger(LockRedisInterceptor.name);
    private redisAvailable = true; // Redis可用性标志

    constructor(private reflector: Reflector) {
        // 初始化Redis客户端
        try {
            this.redisClient = RedisProvider.redisClient.client;
            // 检查Redis连接状态
            this.checkRedisConnection();
        } catch (error) {
            this.logger.error(`Redis客户端初始化失败: ${error.message}`);
            this.redisAvailable = false;
        }
    }

    /**
     * 检查Redis连接状态
     */
    private async checkRedisConnection(): Promise<void> {
        try {
            await this.redisClient.ping();
            if (!this.redisAvailable) {
                this.logger.log('Redis连接已恢复');
                this.redisAvailable = true;
            }
        } catch (error) {
            this.logger.error(`Redis连接检查失败: ${error.message}`);
            this.redisAvailable = false;
        }
    }

    public async intercept(ctx: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        // 从反射器中获取配置
        const cacheConfig = this.reflector.get<LockConfig>(API_LOCK_MECHANISMS, ctx.getHandler());
        if (!cacheConfig) {
            return next.handle();
        }

        // 如果Redis不可用，直接降级处理
        if (!this.redisAvailable) {
            this.logger.warn('Redis不可用，降级为直接处理请求');
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
            let acquired = false;

            // 添加重试逻辑，处理临时性连接问题
            for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
                try {
                    acquired = await this.acquireLock(lockKey, requestId);
                    break; // 成功获取锁，跳出循环
                } catch (error) {
                    if (attempt === this.retryAttempts - 1) {
                        throw error; // 最后一次尝试失败，抛出错误
                    }
                    this.logger.warn(`尝试获取锁失败 (${attempt + 1}/${this.retryAttempts}): ${error.message}`);
                    await this.delay(this.retryDelay);
                    await this.checkRedisConnection(); // 检查Redis连接状态

                    // 如果Redis不可用，直接降级
                    if (!this.redisAvailable) {
                        this.logger.warn('Redis连接中断，降级为直接处理请求');
                        return next.handle();
                    }
                }
            }

            if (acquired) {
                // 获取锁成功，设置定时刷新
                let refreshInterval;

                try {
                    refreshInterval = setInterval(() => {
                        this.refreshLock(lockKey, requestId).catch((error) => {
                            this.logger.error(`刷新锁失败: ${error.message}`);
                            clearInterval(refreshInterval);
                        });
                    }, this.lockRefreshInterval);
                } catch (error) {
                    this.logger.error(`设置锁刷新定时器失败: ${error.message}`);
                }

                return next.handle().pipe(
                    map((data: ResponseBody<any>) => {
                        if (refreshInterval) clearInterval(refreshInterval);
                        // 处理完成后，释放锁并发布通知
                        this.finishProcessing(lockKey, requestId).catch(error =>
                            this.logger.error(`释放锁失败: ${error.message}`));
                        return data;
                    }),
                    catchError((err: HttpException) => {
                        if (refreshInterval) clearInterval(refreshInterval);
                        // 错误处理后，也释放锁并发布通知
                        this.finishProcessing(lockKey, requestId).catch(error =>
                            this.logger.error(`释放锁失败: ${error.message}`));
                        return throwError(err);
                    })
                );
            } else {
                // 获取锁失败，尝试将请求ID加入队列
                try {
                    await this.redisClient.rpush(queueKey, requestId);
                } catch (error) {
                    this.logger.error(`将请求加入队列失败: ${error.message}`);
                    // 降级处理：如果加入队列失败，直接处理请求
                    return next.handle();
                }

                // 等待轮到自己执行
                let isProcessed = false;
                try {
                    isProcessed = await this.waitForTurn(lockKey, queueKey, requestId);
                } catch (error) {
                    this.logger.error(`等待锁失败: ${error.message}`);
                    // 错误处理：尝试清理队列中的自己
                    await this.safeRemoveFromQueue(queueKey, requestId);
                    // 降级处理：直接处理请求
                    return next.handle();
                }

                if (!isProcessed) {
                    // 清理队列中的自己
                    await this.safeRemoveFromQueue(queueKey, requestId);
                    return throwError(new HttpException('操作超时请重试', 503));
                }

                // 设置刷新定时器
                let refreshInterval;
                try {
                    refreshInterval = setInterval(() => {
                        this.refreshLock(lockKey, requestId).catch((error) => {
                            this.logger.error(`刷新锁失败: ${error.message}`);
                            clearInterval(refreshInterval);
                        });
                    }, this.lockRefreshInterval);
                } catch (error) {
                    this.logger.error(`设置锁刷新定时器失败: ${error.message}`);
                }

                return next.handle().pipe(
                    map((data: ResponseBody<any>) => {
                        if (refreshInterval) clearInterval(refreshInterval);
                        this.finishProcessing(lockKey, requestId).catch(error =>
                            this.logger.error(`释放锁失败: ${error.message}`));
                        return data;
                    }),
                    catchError((err: HttpException) => {
                        if (refreshInterval) clearInterval(refreshInterval);
                        this.finishProcessing(lockKey, requestId).catch(error =>
                            this.logger.error(`释放锁失败: ${error.message}`));
                        return throwError(err);
                    })
                );
            }
        } catch (error) {
            // 记录错误日志
            this.logger.error(`锁操作失败: ${error.message}`, error.stack);

            // 尝试清理队列中的自己
            await this.safeRemoveFromQueue(queueKey, requestId);

            // 降级策略: 如果是Redis连接错误，直接处理请求不返回错误
            if (this.isRedisConnectionError(error)) {
                this.redisAvailable = false;
                this.logger.warn('Redis连接失败，降级为直接处理请求');
                return next.handle();
            }

            return throwError(new HttpException('锁操作失败', 503));
        }
    }

    /**
     * 判断是否是Redis连接错误
     */
    private isRedisConnectionError(error: any): boolean {
        if (!error) return false;
        const errorMsg = error.message ? error.message.toLowerCase() : '';
        return errorMsg.includes('connect') ||
               errorMsg.includes('connection') ||
               errorMsg.includes('timeout') ||
               errorMsg.includes('network');
    }

    /**
     * 安全地从队列中移除请求ID
     */
    private async safeRemoveFromQueue(queueKey: string, requestId: string): Promise<void> {
        try {
            await this.removeFromQueue(queueKey, requestId);
        } catch (error) {
            this.logger.error(`从队列中移除请求ID失败: ${error.message}`);
        }
    }

    /**
     * 延迟函数
     */
    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 从队列中移除请求ID
     */
    private async removeFromQueue(queueKey: string, requestId: string): Promise<void> {
        try {
            const script = `
                local count = redis.call('lrem', KEYS[1], 1, ARGV[1])
                return count
            `;
            await this.redisClient.eval(script, 1, queueKey, requestId);
        } catch (error) {
            this.logger.error(`从队列中移除请求ID失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 等待轮到自己执行
     */
    private async waitForTurn(lockKey: string, queueKey: string, requestId: string): Promise<boolean> {
        const startTime = Date.now();

        while (Date.now() - startTime < this.waitTimeout) {
            try {
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
                await this.delay(this.pollInterval);

                // 定期检查Redis连接
                if ((Date.now() - startTime) % 5000 < this.pollInterval) {
                    await this.checkRedisConnection();
                }

                // 如果Redis不可用，直接返回
                if (!this.redisAvailable) {
                    return false;
                }
            } catch (error) {
                this.logger.error(`等待获取锁时出错: ${error.message}`);
                // 检查Redis连接
                await this.checkRedisConnection();
                if (!this.redisAvailable) {
                    return false;
                }
                await this.delay(this.pollInterval * 2);
            }
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
        try {
            const result = await this.redisClient.set(
                lockKey,
                requestId,
                'NX',
                'PX',
                this.lockExpireTime
            );
            return result === 'OK';
        } catch (error) {
            this.logger.error(`获取锁失败: ${error.message}`);
            await this.checkRedisConnection();
            throw error;
        }
    }

    /**
     * 刷新锁过期时间
     */
    private async refreshLock(lockKey: string, requestId: string): Promise<void> {
        try {
            const script = `
                if redis.call("get", KEYS[1]) == ARGV[1] then
                    return redis.call("pexpire", KEYS[1], ARGV[2])
                else
                    return 0
                end
            `;
            await this.redisClient.eval(script, 1, lockKey, requestId, this.lockExpireTime);
        } catch (error) {
            this.logger.error(`刷新锁过期时间失败: ${error.message}`);
            await this.checkRedisConnection();
            throw error;
        }
    }

    /**
     * 释放Redis分布式锁
     */
    private async releaseLock(lockKey: string, requestId: string): Promise<void> {
        try {
            const script = `
                if redis.call("get", KEYS[1]) == ARGV[1] then
                    return redis.call("del", KEYS[1])
                else
                    return 0
                end
            `;
            await this.redisClient.eval(script, 1, lockKey, requestId);
        } catch (error) {
            this.logger.error(`释放锁失败: ${error.message}`);
            await this.checkRedisConnection();
            throw error;
        }
    }
}

