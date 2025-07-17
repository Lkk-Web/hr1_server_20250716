import { ExceptionCatchFilter } from '@core/filter/exception'
import { LogInterceptor } from '@core/interceptor/log'
import { DtoPipe } from '@core/pipe'
import { LoggerModule } from '@library/logger'
import { MysqlModule } from '@library/mysql'
import { TasksModule } from '@library/tasks'
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { AppController } from './app.controller'
import { AbnormalFilter } from '@core/filter/abnormalFilter'
import { HookModule } from '@modules/hooks/hook.module'
import { SequelizeModule } from '@nestjs/sequelize'
import * as ModelList from '@model/index'
import { AuthModule } from '@modules/auth/auth.module'

@Module({
  imports: [
    // The common modules
    LoggerModule,
    ScheduleModule.forRoot(),
    TasksModule,
    MysqlModule,
    HookModule,
    // TOTO.添加数据表
    SequelizeModule.forFeature(Object.values(ModelList)),

    // TODO.添加业务板块
    AuthModule,
  ],
  controllers: [AppController],
  exports: [DtoPipe, LogInterceptor, ExceptionCatchFilter, AbnormalFilter],
  providers: [DtoPipe, LogInterceptor, ExceptionCatchFilter, AbnormalFilter],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): any {
    // bind the middleware,
    consumer
      .apply((req, res, next) => {
        req.startTime = Date.now()
        next()
      })
      // and register it for all routes (in case of Fastify use '(.*)')
      .forRoutes('*')
  }
}
