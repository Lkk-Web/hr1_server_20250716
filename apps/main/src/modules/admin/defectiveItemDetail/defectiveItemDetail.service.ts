import { BOM, Material, Process, ProductionOrder, ProductionReport } from '@model/index'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { FindPaginationDto } from './defectiveItemDetail.dto'
import { FindPaginationOptions } from '@model/shared/interface'
import { Pagination } from '@common/interface'
import { Op } from 'sequelize'
import { RedisProvider } from '@library/redis'
import { Redis } from '@sophons/redis'
import { Paging } from '@library/utils/paging'
import { Column, Style } from 'exceljs'
import dayjs = require('dayjs')

@Injectable()
export class DefectiveItemDetailService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: Redis
  ) { }
  public async findPagination(dto: FindPaginationDto, pagination: Pagination, loadModel) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
      include: [
        {
          where: {},
          association: 'order',
          include: [
            {
              where: {},
              association: 'bom',
              include: [
                {
                  where: {},
                  association: 'parentMaterial',
                },
              ],
            },
          ],
        },
        {
          where: {},
          association: 'process',
          attributes: ['processName'],
        },
        {
          where: {},
          association: 'productUser',
          attributes: ['userName'],
        },
        {
          where: {},
          association: 'pri',
          include: [
            {
              association: 'defectiveItem',
            },
          ],
        },
        {
          association: 'task',
        },
      ],
    }

    if (dto.bomCode) {
      options.include[0].include[0].where = {
        ...options.include[0].include[0].where, // 保留原有的条件
        code: dto.bomCode, // 添加 bomCode 查询条件
      }
    }
    if (dto.bomName) {
      options.include[0].include[0].include[0].where = {
        ...options.include[0].include[0].include[0].where,
        name: dto.bomName,
      }
    }
    if (dto.bomSpec) {
      options.include[0].include[0].include[0].where = {
        ...options.include[0].include[0].include[0].where,
        spec: dto.bomSpec,
      }
    }

    if (dto.productionOrderCode) {
      options.include[0].where = {
        ...options.include[0].where,
        code: dto.productionOrderCode,
      }
    }

    if (dto.processName) {
      options.include[1].where = {
        ...options.include[1].where,
        processName: dto.processName,
      }
    }

    if (dto.productionOrderStatus) {
      options.include[0].where = {
        ...options.include[0].where,
        status: dto.productionOrderStatus,
      }
    }

    if (dto.startTime) {
      options.where = {
        ...options.where,
        startTime: {
          [Op.gte]: dto.startTime,
        },
      }
    }
    if (dto.endTime) {
      options.where = {
        ...options.where,
        endTime: {
          [Op.lte]: dto.endTime,
        },
      }
    }

    // @ts-ignore
    const result = await Paging.diyPaging(ProductionReport, pagination, options)
    return result
  }

  async export(dto: FindPaginationDto, loadModel) {
    const options: FindPaginationOptions = {
      where: {},
      include: [
        {
          where: {},
          association: 'order',
          include: [
            {
              where: {},
              association: 'bom',
              include: [
                {
                  where: {},
                  association: 'parentMaterial',
                },
              ],
            },
          ],
        },
        {
          where: {},
          association: 'process',
          attributes: ['processName'],
        },
        {
          where: {},
          association: 'productUser',
          attributes: ['userName'],
        },
        {
          where: {},
          association: 'pri',
          include: [
            {
              association: 'defectiveItem',
            },
          ],
        },
        {
          association: 'task',
        },
      ],
    }

    if (dto.bomCode) {
      options.include[0].include[0].where = {
        ...options.include[0].include[0].where, // 保留原有的条件
        code: dto.bomCode, // 添加 bomCode 查询条件
      }
    }
    if (dto.bomName) {
      options.include[0].include[0].include[0].where = {
        ...options.include[0].include[0].include[0].where,
        name: dto.bomName,
      }
    }
    if (dto.bomSpec) {
      options.include[0].include[0].include[0].where = {
        ...options.include[0].include[0].include[0].where,
        spec: dto.bomSpec,
      }
    }

    if (dto.productionOrderCode) {
      options.include[0].where = {
        ...options.include[0].where,
        code: dto.productionOrderCode,
      }
    }

    if (dto.processName) {
      options.include[1].where = {
        ...options.include[1].where,
        processName: dto.processName,
      }
    }

    if (dto.productionOrderStatus) {
      options.include[0].where = {
        ...options.include[0].where,
        status: dto.productionOrderStatus,
      }
    }

    if (dto.startTime) {
      options.where = {
        ...options.where,
        startTime: {
          [Op.gte]: dto.startTime,
        },
      }
    }
    if (dto.endTime) {
      options.where = {
        ...options.where,
        endTime: {
          [Op.lte]: dto.endTime,
        },
      }
    }

    const result = await ProductionReport.findAll(options)
    console.log(result)
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
        key: 'materialName',
        width: 30,
        style,
      },
      {
        header: '产品规格',
        key: 'materialSpec',
        width: 30,
        style,
      },
      {
        header: '单位',
        key: 'unit',
        width: 30,
        style,
      },
      {
        header: '工单计划数',
        key: 'productionOrderNum',
        width: 30,
        style,
      },
      {
        header: '工单状态',
        key: 'productionOrderStatus',
        width: 30,
        style,
      },
      {
        header: '工单计划开始日期',
        key: 'poStartAt',
        width: 30,
        style,
      },
      {
        header: '工单计划结束日期',
        key: 'poEndAt',
        width: 30,
        style,
      },
      {
        header: '工序名称',
        key: 'processName',
        width: 30,
        style,
      },
      {
        header: '任务计划开始日期',
        key: 'ptStartTime',
        width: 30,
        style,
      },
      {
        header: '任务计划结束日期',
        key: 'ptEndTime',
        width: 30,
        style,
      },
      {
        header: '任务实际开始日期',
        key: 'actualStartTime',
        width: 30,
        style,
      },
      {
        header: '任务实际结束日期',
        key: 'actualEndTime',
        width: 30,
        style,
      },
      {
        header: '任务状态',
        key: 'ptStatus',
        width: 30,
        style,
      },
      {
        header: '任务计划数',
        key: 'planCount',
        width: 30,
        style,
      },
      {
        header: '任务实际数',
        key: 'realityNum',
        width: 30,
        style,
      },
      {
        header: '生产人员',
        key: 'productUser',
        width: 30,
        style,
      },
      {
        header: '报工数',
        key: 'reportQuantity',
        width: 30,
        style,
      },
      {
        header: '良品数',
        key: 'goodCount',
        width: 30,
        style,
      },
      {
        header: '不良品数',
        key: 'badCount',
        width: 30,
        style,
      },
      {
        header: '不良品率',
        key: 'badRate',
        width: 30,
        style,
      },
      {
        header: '不良品原因',
        key: 'defectiveName',
        width: 30,
        style,
      },
      {
        header: '毛刺【不良数量】',
        key: 'badNum1',
        width: 30,
        style,
      },
      {
        header: '毛刺【不良品率】',
        key: 'badRate1',
        width: 30,
        style,
      },
      {
        header: '划痕【不良数量】',
        key: 'badNum2',
        width: 30,
        style,
      },
      {
        header: '划痕【不良品率】',
        key: 'badRate2',
        width: 30,
        style,
      },
      {
        header: '打磨出错【不良数量】',
        key: 'badNum3',
        width: 30,
        style,
      },
      {
        header: '打磨出错【不良品率】',
        key: 'badRate3',
        width: 30,
        style,
      },
    ]

    let dataList = []
    const performanceData = {
      sheetName: '不良品相详情统计',
      rows: [],
      columns: columns,
    }

    result.forEach(value => {
      let defectiveCause = ''
      let badNumber1 = 0 //毛刺
      let badNumber2 = 0 //划痕
      let badNumber3 = 0 //打磨出错
      for (let i = 0; i < value.pri.length; i++) {
        defectiveCause = defectiveCause + value.pri[i].defectiveItem.name + ','
        switch (value.pri[i].defectiveItem.name) {
          case '划痕':
            badNumber2 = value.pri[i].count + badNumber2
            break
          case '打磨出错':
            badNumber3 = value.pri[i].count + badNumber3
            break
          case '毛刺':
            badNumber1 = value.pri[i].count + badNumber1
            break
        }
      }
      console.log(badNumber1)

      const temp: any = {
        // productionOrderCode: value.order.code,
        // bomCode: value.order.bom.parentMaterial.code,
        // materialName: value.order.bom.parentMaterial.materialName,
        // materialSpec: value.order.bom.parentMaterial.spec,
        // unit: value.order.bom.parentMaterial.unit,

        productionOrderStatus: value.order.status,

        poStartAt: dayjs(value.order.startTime).format('YYYY-MM-DD'),
        poEndAt: dayjs(value.order.endTime).format('YYYY-MM-DD'),

        processName: value.process.processName,
        ptStartTime: dayjs(value.task.startTime).format('YYYY-MM-DD'),
        ptEndTime: dayjs(value.task.endTime).format('YYYY-MM-DD'),

        actualStartTime: dayjs(value.task.actualStartTime).format('YYYY-MM-DD'),
        actualEndTime: dayjs(value.task.actualEndTime).format('YYYY-MM-DD'),
        ptStatus: value.task.status,
        planCount: value.task.planCount,
        crealityNum: value.task.badCount + value.task.goodCount,
        productUser: value.productUser.userName,
        reportQuantity: value.reportQuantity,
        goodCount: value.task.goodCount,
        badCount: value.task.badCount,
        badRate: value.task.badCount / (value.task.badCount + value.task.goodCount),
        defectiveName: defectiveCause,
        badNum1: badNumber1,
        badReate1: ((badNumber1 / (value.task.badCount + value.task.goodCount)) * 100).toFixed(2),
        badNum2: badNumber2,
        badRate2: ((badNumber2 / (value.task.badCount + value.task.goodCount)) * 100).toFixed(2),
        badNum3: badNumber3,
        badRate3: ((badNumber3 / (value.task.badCount + value.task.goodCount)) * 100).toFixed(2),
      }
      performanceData.rows.push(temp)
    })
    dataList.push(performanceData)
    return dataList
  }
}
