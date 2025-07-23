import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { Paging } from '@library/utils/paging'
import { ProductionOrder } from '@model/index'
import { FindPaginationOptions } from '@model/shared/interface'
import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { Redis } from '@sophons/redis'
import { Sequelize } from 'sequelize-typescript'
import { Column, Style, Workbook } from 'exceljs'
import { FindPaginationDto } from './workInProgressReport.dto'
import { Op } from 'sequelize'

@Injectable()
export class WorkInProgressReportService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: Redis,

    @InjectModel(ProductionOrder)
    private sequelize: Sequelize
  ) {}
  //工单表、产品表、物料表、工序任务单、
  public async findPagination(dto: FindPaginationDto, pagination: Pagination, loadModel) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
      attributes: ['id', 'code', 'status', 'plannedOutput', 'actualOutput'],
      include: [
        {
          where: {},
          association: 'bom',
          attributes: ['id'],
          // required: false,
          include: [
            {
              where: {},
              association: 'parentMaterial',
              attributes: ['name', 'spec', 'attr', 'unit', 'code'],
              // required: false,
            },
          ],
        },
        {
          association: 'tasks',
          attributes: ['planCount', 'goodCount', 'badCount'],
          required: false,
          include: [
            {
              association: 'process',
              attributes: ['processName'],
              required: false,
            },
          ],
        },
      ],
    }
    if (dto.bomCode) {
      options.include[0].where = {
        ...options.include[0].where, // 保留原有的条件
        code: dto.bomCode, // 添加 bomCode 查询条件
      }
    }
    if (dto.bomName) {
      options.include[0].include[0].where['name'] = {
        [Op.like]: `%${dto.bomName}%`,
      }
    }
    if (dto.bomSpec) {
      options.include[0].include[0].where = {
        ...options.include[0].include[0].where,
        spec: dto.bomSpec,
      }
    }
    const result = await Paging.diyPaging(ProductionOrder, pagination, options)
    let res = JSON.parse(JSON.stringify(result))

    for (let one of res.data) {
      let newTasks = {}
      let tasks = one.tasks
      for (let i = 0; i < tasks.length; i++) {
        let task = tasks[i]
        if (i == 0) {
          //在制品=本工序的计划数-本工序的良品数
          task['zzp'] = task.planCount - task.goodCount
        } else {
          //在制品=上一工序的良品数-本工序的良品数-本工序的不良品数
          task['zzp'] = tasks[i - 1].goodCount - task.goodCount - task.badCount
        }
        //未清数=计划数-良品数
        task['wqs'] = task.planCount - task.goodCount
        newTasks[task.process.processName] = {
          planCount: task.planCount,
          goodCount: task.goodCount,
          badCount: task.badCount,
          zzp: task.zzp,
          wqs: task.wqs,
        }
      }
      one.tasks = newTasks
    }
    return res
  }

  async export(dto: any, loadModel) {
    const options: FindPaginationOptions = {
      where: {},
      attributes: ['id', 'code', 'status', 'plannedOutput', 'actualOutput'],
      include: [
        {
          where: {},
          association: 'bom',
          attributes: ['id'],
          // required: false,
          include: [
            {
              where: {},
              association: 'parentMaterial',
              attributes: ['name', 'spec', 'attr', 'unit', 'code'],
              // required: false,
            },
          ],
        },
        {
          association: 'tasks',
          attributes: ['planCount', 'goodCount', 'badCount'],
          required: false,
          include: [
            {
              association: 'process',
              attributes: ['processName'],
              required: false,
            },
          ],
        },
      ],
    }
    if (dto.bomCode) {
      options.include[0].where = {
        ...options.include[0].where, // 保留原有的条件
        code: dto.bomCode, // 添加 bomCode 查询条件
      }
    }
    if (dto.bomName) {
      options.include[0].include[0].where['name'] = {
        [Op.like]: `%${dto.bomName}%`,
      }
    }
    if (dto.bomSpec) {
      options.include[0].include[0].where = {
        ...options.include[0].include[0].where,
        spec: dto.bomSpec,
      }
    }
    const result = await ProductionOrder.findAll(options)
    const style: Partial<Style> = {
      alignment: {
        horizontal: 'center',
      },
    }
    const columns: Array<Partial<Column>> = [
      {
        header: '工单编号',
        key: 'productionOrderCode',
        width: 20,
        style,
      },
      {
        header: '产品编号',
        key: 'bomCode',
        width: 20,
        style,
      },
      {
        header: '产品名称',
        key: 'bomName',
        width: 20,
        style,
      },
      {
        header: '产品规格',
        key: 'bomSpec',
        width: 20,
        style,
      },

      {
        header: '工单状态',
        key: 'status',
        width: 20,
        style,
      },
      {
        header: '计划数',
        key: 'planCount',
        width: 20,
        style,
      },
      {
        header: '良品数',
        key: 'goodCount',
        width: 20,
        style,
      },
      {
        header: '计划数（工序一）',
        key: 'planCountOne',
        width: 40,
        style,
      },
      {
        header: '良品数（工序一）',
        key: 'goodCountOne',
        width: 40,
        style,
      },
      {
        header: '不良品数（工序一）',
        key: 'badCountOne',
        width: 40,
        style,
      },
      {
        header: '在制品数（工序一）',
        key: 'processCountOne',
        width: 40,
        style,
      },
      {
        header: '未清数（工序一）',
        key: 'unClearCountOne',
        width: 40,
        style,
      },
      {
        header: '计划数（工序二）',
        key: 'planCountTwo',
        width: 40,
        style,
      },
      {
        header: '良品数（工序二）',
        key: 'goodCountTwo',
        width: 40,
        style,
      },
      {
        header: '不良品数（工序二）',
        key: 'badCountTwo',
        width: 40,
        style,
      },
      {
        header: '在制品数（工序二）',
        key: 'processCountTwo',
        width: 40,
        style,
      },
      {
        header: '未清数（工序二）',
        key: 'unClearCountTwo',
        width: 40,
        style,
      },
      {
        header: '计划数（工序三）',
        key: 'planCountThree',
        width: 40,
        style,
      },
      {
        header: '良品数（工序三）',
        key: 'goodCountThree',
        width: 40,
        style,
      },
      {
        header: '不良品数（工序三）',
        key: 'badCountThree',
        width: 40,
        style,
      },
      {
        header: '在制品数（工序三）',
        key: 'processCountThree',
        width: 40,
        style,
      },
      {
        header: '未清数（工序三）',
        key: 'unClearCountThree',
        width: 40,
        style,
      },
    ]

    let dataList = []
    const performanceData = {
      sheetName: '在制品报表',
      rows: [],
      columns: columns,
    }
    result.forEach(value => {
      let processCountOne = 0
      let unClearCountOne = 0
      let planCountOne = 0
      let goodCountOne = 0
      let badCountOne = 0
      let processCountTwo = 0
      let unClearCountTwo = 0
      let planCountTwo = 0
      let goodCountTwo = 0
      let badCountTwo = 0
      let processCountThree = 0
      let unClearCountThree = 0
      let planCountThree = 0
      let goodCountThree = 0
      let badCountThree = 0
      if (value.tasks[0]) {
        planCountOne = value.tasks[0].planCount
        goodCountOne = value.tasks[0].goodCount
        badCountOne = value.tasks[0].badCount
        processCountOne = value.tasks[0].reportRatio * planCountOne
        unClearCountOne = planCountOne - goodCountOne - processCountOne
      }
      if (value.tasks[1]) {
        planCountTwo = value.tasks[1].planCount
        goodCountTwo = value.tasks[1].goodCount
        badCountTwo = value.tasks[1].badCount
        processCountTwo = goodCountOne - value.tasks[1].reportRatio * planCountTwo
        unClearCountTwo = planCountTwo - goodCountTwo - processCountTwo
      }
      if (value.tasks[2]) {
        planCountThree = value.tasks[2].planCount
        goodCountThree = value.tasks[2].goodCount
        badCountThree = value.tasks[2].badCount
        processCountThree = goodCountTwo - value.tasks[2].reportRatio * planCountThree
        unClearCountThree = planCountThree - goodCountThree - processCountThree
      }
      const temp: any = {
        productionOrderCode: value.code,
        bomCode: value.bom.parentMaterial.code,
        bomName: value.bom.parentMaterial.materialName,
        bomSpec: value.bom.parentMaterial.spec,
        status: value.status,
        planCount: value.plannedOutput,
        goodCount: value.actualOutput,
        planCountOne: planCountOne,
        goodCountOne: goodCountOne,
        badCountOne: badCountOne,
        processCountOne: processCountOne,
        unClearCountOne: unClearCountOne,
        planCountTwo: planCountTwo,
        goodCountTwo: goodCountTwo,
        badCountTwo: badCountTwo,
        processCountTwo: processCountTwo,
        unClearCountTwo: unClearCountTwo,
        planCountThree: planCountThree,
        goodCountThree: goodCountThree,
        badCountThree: badCountThree,
        processCountThree: processCountThree,
        unClearCountThree: unClearCountThree,
      }
      performanceData.rows.push(temp)
    })
    dataList.push(performanceData)
    return dataList
  }
}
