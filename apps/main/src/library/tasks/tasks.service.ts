import { Injectable, Logger } from '@nestjs/common'
import { Cron, Interval, Timeout } from '@nestjs/schedule'
import { TasksTwoMethod } from './tasksTwo.method'
import { Aide } from '@library/utils/aide'
import { TableNames } from '@common/constant'
import { MiService } from '@modules/admin/mi/mi.service'

@Injectable()
export class TasksService {
  constructor(private readonly tasksMethodTwo: TasksTwoMethod, private readonly miService: MiService) {}
  private readonly logger = new Logger(TasksService.name)

  // @Cron('45 * * * * *')
  // handleCron() {
  //   this.logger.debug('Called when the second is 45')
  // }

  // @Interval(30000)
  // handleInterval() {
  //   this.logger.debug('Called every 30 seconds')
  // }

  // @Timeout(5000)
  // handleTimeout() {
  //   this.logger.debug('Called once after 5 seconds')
  // }
  @Cron('00 58 23 * * *')
  async handleCron6() {
    if (process.env.INSTANCE_ID == undefined || process.env.INSTANCE_ID == '0') {
      await this.tasksMethodTwo.sendApiData()
    }
  }
  @Cron('00 00 12 * * *')
  async handleCron3() {
    if (process.env.INSTANCE_ID == undefined || process.env.INSTANCE_ID == '0') {
      await this.tasksMethodTwo.sendApiData()
    }
  }

  @Interval(1000 * 15)
  async handleInterval2() {
    const num = process.env.INSTANCE_ID ? Number(process.env.INSTANCE_ID) + 1 : 1
    setTimeout(() => {
      this.tasksMethodTwo.getApiData()
    }, num * 600)
    Aide.purgeBuffer()
  }

  // @Interval(30000) // 每隔 30000 毫秒 = 30 秒 执行一次
  @Cron('0 0 2 * * *') // 每天凌晨2点(02:00:00)执行一次
  async handleKingdeeSync() {
    try {
      this.logger.log('开始执行金蝶数据同步任务')

      // 需要同步的数据类型
      const syncTables = [TableNames.部门, TableNames.用户, TableNames.物料, TableNames.物料BOM, TableNames.供应商, TableNames.客户, TableNames.销售订单]

      let totalSyncCount = 0

      for (const tableName of syncTables) {
        try {
          this.logger.log(`开始同步 ${tableName}`)
          const result = await this.miService.syncKingdee({ tableName })
          totalSyncCount += result.count || 0
          this.logger.log(`${tableName} 同步完成，同步记录数: ${result.count}`)
        } catch (error) {
          this.logger.error(`${tableName} 同步失败:`, error)
        }
      }

      this.logger.log(`金蝶数据同步任务完成，总计同步记录数: ${totalSyncCount}`)
    } catch (error) {
      this.logger.error('金蝶数据同步失败:', error)
    }
  }
}
