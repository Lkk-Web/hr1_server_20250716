import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import * as configs from '@common/config'
import { ExceptionCatchFilter } from '@core/filter/exception'
import { DtoPipe } from '@core/pipe'
import { LoggerModule, LoggerProvider } from './library/logger'
import { LogInterceptor } from '@core/interceptor/log'
import { join } from 'path'
import { AbnormalFilter } from './core/filter/abnormalFilter'
import * as os from 'os'
import initApiLogger from 'api-stack-log'
import express = require('express')
import * as AuthModules from '@modules/auth/index'
import { MicroserviceOptions } from '@nestjs/microservices'
import { swaggerStart } from '@library/utils/swagger'

// 微信支付回调配置
// const bodyParser = require('body-parser')
// require('body-parser-xml')(bodyParser)

const getLocalIP = () => {
  const ips = []
  const interfaces = os.networkInterfaces()
  for (let devName in interfaces) {
    const iface = interfaces[devName]
    ips.push(iface[1].address)
  }
  return ips
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true })
  const iocContext = app.select(AppModule)
  const logger = app.select(LoggerModule).get(LoggerProvider)
  app.useLogger(logger)

  // 微服务
  const microserviceOptions: MicroserviceOptions | any = configs.MicroserviceConfig
  app.connectMicroservice(microserviceOptions)
  await app.startAllMicroservices()

  // 微信支付回调配置
  // app.use(bodyParser.xml())
  // 同步单个表结构
  try {
    // await User.sync({ alter: true, force: false })
  } catch (e) {
    console.log(e)
  }

  // this.app.use(helmet());
  // 配置 public 文件夹为静态目录，以达到可直接访问下面文件的目的
  const rootDir = join(__dirname, '..')
  app.use('/', express.static(join(rootDir, 'public')))
  app.useGlobalInterceptors(iocContext.get(LogInterceptor))
  //监听线程异常
  process.on('uncaughtException', function (err) {
    console.error('线程出现异常=>>', err)
    logger.error('线程出现异常=>>' + err.message)
  })
  process.on('unhandledRejection', function (reason, promise) {
    console.error('线程异常未处理=>>', reason)
    logger.error('线程异常未处理=>>' + reason['message'])
  })
  // 异常捕捉格式化
  app.useGlobalPipes(iocContext.get(DtoPipe))
  // 异常捕捉格式化
  app.useGlobalFilters(iocContext.get(ExceptionCatchFilter), iocContext.get(AbnormalFilter))
  if (configs.ApiLoggerConfig.enabled) {
    const expressApp = app.getHttpAdapter().getInstance()
    await initApiLogger(expressApp, configs.ApiLoggerConfig)
    setTimeout(() => {
      console.log(`[api_log_UI]`, `http://127.0.0.1:${configs.info.port}${configs.ApiLoggerConfig.routePrefix}/ui/#`)
    }, 300)
  }

  // 创建接口文档
  if (configs.info.isDebug) {
    // ips = getLocalIP()
    swaggerStart(app, { title: '微服务权限文档', path: 'auth', modules: AuthModules, desc: '' }, configs.info.port)
  }

  // 启动
  await app.listen(configs.info.port)

  console.log('[microservice start]', `TCP://localhost:${microserviceOptions.options.port}`)
  console.log('[server start]', `http://127.0.0.1:${configs.info.port}/`)
}

bootstrap()
