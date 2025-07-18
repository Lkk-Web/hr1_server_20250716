import { APP_ENV } from './enum'
import { AliOssAccount, BusinessInfo, Configs, IoRedisOptions, MicroserviceConfig, ReMailbox, SequlizeOptions, WeChat } from '@common/interface'
import { join } from 'path'
import { pathConstant } from '@common/constant'
import YAML = require('yaml')
import fs = require('fs')
import { Transport } from '@nestjs/microservices'

let buffer = fs.readFileSync(process.env.RUN_ENV || 'config.yaml', 'utf8')
const envs: { [key: string]: any } = YAML.parse(buffer)

;['appConfig', 'cos', 'redis', 'dp', 'enable', 'mail', 'apiLogger'].forEach(v => {
  if (!envs[v]) envs[v] = {}
})

export const info: Configs = {
  env: envs.appConfig.env || 'dev',
  appName: envs.appConfig.name || 'appDebug',
  enableFileLoging: envs.enable.fileLogIng,
  enableConsoleLoging: envs.enable.consoleLogIng,
  isDebug: envs.appConfig.env == APP_ENV.dev,
  port: envs.appConfig.port || '8002',
  gitCiAuthorize: envs['GIT_CI_AUTHORIZE'] ? envs['GIT_CI_AUTHORIZE'].split('|') : [],
  appKey: envs.appConfig.key,
  pay_notify_url: envs.PAY_NOTIFY_URL,
  refund_notify_url: envs.REFUND_NOTIFY_URL,
  wsNameSpace: envs.WS_NAMESPACE,
  proxyAuth: envs.PROXY_AUTH,
}

export const MYSQL_CONFIG: SequlizeOptions = {
  dialect: 'mysql',
  timezone: '+08:00',
  pool: { max: 5 },
  autoLoadModels: true, //是否自动创建
  logging: false, //是否打印日志
  ...envs.dp,
}

export const COS_CONFIG = {
  SecretId: envs.cos.keyId,
  SecretKey: envs.cos.keySecret,
  Bucket: envs.cos.bucket,
  Region: envs.cos.region,
  domainProtocol: 'https',
  domain: envs.cos.domain,
  dir: info.appName + '/uploads', // cos文件路径, 不定义则会上传至bucket的根目录
}
export const REDIS: IoRedisOptions = {
  expiredTime: 1500,
  ...envs.redis,
}

export const WeAppInfo: WeChat = {
  appID: '',
  appSecret: '',
}

export const WX_BUSINESS: BusinessInfo = {
  app_id: '',
  mchId: '',
  partner_key: '',
  pfxName: '',
}

export const ReMailboxInfo: ReMailbox = {
  title: 'API接口统计通知',
  ...(envs.mail || {}),
}

export const OSS_ACCOUNT: AliOssAccount = {
  region: '',
  accessKeyId: '',
  accessKeySecret: '',
  bucket: '',
  endpoint: 'HOME_PATH',
  // cname: 'HOME_PATH'?true:false,
  timeout: 120 * 1000, // 设置上传超时时间为 120 秒
}

export const MINIO_CONFIG = {
  endPoint: process.env.MINIO_POINT,
  port: process.env.MINIO_PORT ? Number(process.env.MINIO_PORT) : 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESSKEY,
  secretKey: process.env.MINIO_SECRETKEY,
  dir: process.env.APP_NAME + '/uploads', // cos文件路径, 不定义则会上传至bucket的根目录
  bucket: process.env.MINIO_BUCKET,
  url: process.env.MINIO_URL,
}

/**
 * Auth 微服务配置
 */
export const authServiceConfig: MicroserviceConfig = {
  transport: Transport.TCP,
  options: {
    host: envs.microservice.MICROSERVICE_HOST || '127.0.0.1',
    port: parseInt(envs.microservice.MICROSERVICE_PORT) || 3001,
  },
}

/*
export const WsServer:SocketServer<Admin,User> = {
  user:[],
  socketIDs:{}
}
*/
