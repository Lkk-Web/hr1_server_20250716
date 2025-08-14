import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import * as configs from '@common/config'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ExceptionCatchFilter } from '@core/filter/exception'
import { DtoPipe } from '@core/pipe'
import { LoggerModule, LoggerProvider } from './library/logger'
import { LogInterceptor } from '@core/interceptor/log'
import { join } from 'path'
import * as AdminModules from './modules/admin/index'
import * as StationModules from './modules/station/index'
import { AbnormalFilter } from './core/filter/abnormalFilter'
import { INestApplication } from '@nestjs/common'
import { SwaggerDocumentOptions } from '@nestjs/swagger/dist/interfaces'
import * as os from 'os'
import express = require('express')
import { BOM } from '@model/base/bom.model'
import { BomDetail } from '@model/base/bomDetail.model'
import { SalesOrderDetail } from '@model/plan/salesOrderDetail.model'
import { Process } from '@model/process/process.model'
import { Material } from '@model/base/material.model'
import { ProductionOrderDetail } from '@model/production/productionOrderDetail.model'
import { ProcessTask } from '@model/production/processTask.model'
import { ProductSerial } from '@model/production/productSerial.model'
import { ProductionOrderTaskTeam } from '@model/production/productionOrderTaskOfTeam.model'
import { ProcessPositionTask } from '@model/production/processPositionTask.model'
import { ProcessTaskLog } from '@model/production/processTaskLog.model'
import { ProcessRoute, ProcessRouteList, ProductionReport } from './model'
// 微信支付回调配置
// const bodyParser = require('body-parser')
// require('body-parser-xml')(bodyParser)

async function bootstrap() {
  // 记录启动开始时间
  const startTime = Date.now()
  const app = await NestFactory.create(AppModule, { cors: true })
  const iocContext = app.select(AppModule)
  const logger = app.select(LoggerModule).get(LoggerProvider)
  app.useLogger(logger)
  // 微信支付回调配置
  // app.use(bodyParser.xml())
  // 同步单个表结构
  try {
  } catch (e) {
    console.log(e)
    throw e
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
  // 异常捕捉格式化
  app.useGlobalFilters(iocContext.get(ExceptionCatchFilter), iocContext.get(AbnormalFilter))

  // 创建接口文档
  if (configs.info.isDebug) {
    swaggerStart(app, { title: '管理端文档', path: 'admin', modules: AdminModules, desc: '' })
    swaggerStart(app, { title: '工控屏端文档', path: 'station', modules: StationModules, desc: '' })
  }

  // 启动
  await app.listen(configs.info.port)

  // 计算并输出启动时间
  const endTime = Date.now()
  logger.debug(`⏱️  启动耗时: ${endTime - startTime}ms (${((endTime - startTime) / 1000).toFixed(2)}s)`)
}

//swagger文档 配置
function swaggerStart(app: INestApplication, options: SwaggerStartOptions) {
  try {
    const config = new DocumentBuilder()
      .addBearerAuth()
      .setTitle(options.title)
      .setDescription(options.desc || '')
      .setVersion('1.0')
      .addServer(`http://127.0.0.1:${configs.info.port}`, '本地')
      .addServer(`http://192.168.31.12:${configs.info.port}`, '开发')
      .addServer(`${configs.info.home_path}`, '使用环境')
      .build()
    const documentOptions: SwaggerDocumentOptions = {}
    if (options.modules) {
      documentOptions.include = [...(Object.values(options.modules) as Array<Function>)]
    }
    const document = SwaggerModule.createDocument(app, config, documentOptions)
    const prefix = options.path.replace(/\//, '_')
    SwaggerModule.setup(`doc/${options.path}`, app, document, {
      customSiteTitle: `${options.title}`,
      customCss: `.swagger-ui .model-box-control, .swagger-ui .models-control, .swagger-ui .opblock-summary-control {
        all: inherit;
        border-bottom: 0;
        cursor: pointer;
        flex: 1;
        padding: 0;
        user-select: text;
       }`,
      customJsStr: `
        // 保存原生方法
        const originalGetItem = localStorage.getItem.bind(localStorage)
        const originalSetItem = localStorage.setItem.bind(localStorage)
        const authorizationKey = "${prefix}_authorized"
        // 重写 getItem
        localStorage.getItem = function(key) {
          const newKey = key === 'authorized'?authorizationKey:key
          return originalGetItem(newKey)
        }
        // 重写 setItem
        localStorage.setItem = function(key, value) {
          const newKey = key === 'authorized'?authorizationKey:key
          originalSetItem(newKey, value)
        }
      `,
      swaggerOptions: {
        persistAuthorization: true,
      },
    })
    setTimeout(() => {
      console.log(`[${options.title}]`, `http://127.0.0.1:${configs.info.port}/doc/${options.path}`)
    }, 300)
  } catch (e) {
    console.log(e)
  }
}
interface SwaggerStartOptions {
  modules?: any
  desc?: string
  title: string
  path: string
}

bootstrap()
