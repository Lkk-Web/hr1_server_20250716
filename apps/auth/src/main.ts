import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import * as configs from '@common/config'
import { ExceptionCatchFilter } from '@core/filter/exception'
import { DtoPipe } from '@core/pipe'
import { LoggerModule, LoggerProvider } from './library/logger'
import { LogInterceptor } from '@core/interceptor/log'
import { join } from 'path'
import { AbnormalFilter } from './core/filter/abnormalFilter'
import express = require('express')
import * as AuthModules from '@modules/auth/index'
import { MicroserviceOptions } from '@nestjs/microservices'
import { swaggerStart } from '@library/utils/swagger'

// 微信支付回调配置
// const bodyParser = require('body-parser')
// require('body-parser-xml')(bodyParser)

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true })
  const iocContext = app.select(AppModule)
  const logger = app.select(LoggerModule).get(LoggerProvider)
  app.useLogger(logger)

  // 微服务
  const microserviceOptions: MicroserviceOptions | any = configs.MicroserviceConfig
  try {
    app.connectMicroservice(microserviceOptions)
    await app.startAllMicroservices()
  } catch (error) {
    logger.error('微服务启动失败: ' + error.message)
    throw error
  }

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

  process.on('uncaughtException', error => {
    throw error
  })
  process.on('unhandledRejection', error => {
    throw error
  })

  // 异常捕捉格式化
  app.useGlobalPipes(iocContext.get(DtoPipe))
  app.useGlobalFilters(iocContext.get(ExceptionCatchFilter), iocContext.get(AbnormalFilter))

  // 创建接口文档
  if (configs.info.isDebug) {
    swaggerStart(app, { title: '微服务权限文档', path: 'auth', modules: AuthModules, desc: '', env: configs.info.env }, configs.info.port)
  }

  await app.listen(configs.info.port)
  console.log('[microservice start]', `TCP://localhost:${microserviceOptions.options.port}`)
}

bootstrap()
