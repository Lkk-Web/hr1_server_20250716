import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { Inject, Injectable } from '@nestjs/common'
import { Redis } from '@sophons/redis'
import { FindPaginationDto } from './yieldStatistics.dto'
import { FindPaginationOptions } from '@model/shared/interface'
import { BOM, Material, ProductionOrder, ProductionReport } from '@model/index'
import { Op } from 'sequelize'
import { Paging } from '@library/utils/paging'
import dayjs = require('dayjs')
import { Column, Style } from 'exceljs'

@Injectable()
export class YieldStatisticsService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: Redis
  ) {}

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, loadModel) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
      attributes: ['remark', 'id'],
      include: [
        {
          where: {},
          association: 'bom',
          attributes: ['code'],
          include: [
            {
              where: {},
              association: 'parentMaterial',
              attributes: ['name', 'spec', 'attr', 'unit', 'code'],
            },
          ],
        },
        {
          association: 'tasks',
          attributes: ['goodCount', 'badCount'],
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
      options.include[0].include[0].where = {
        ...options.include[0].include[0].where,
        name: dto.bomName,
      }
    }
    if (dto.bomSpec) {
      options.include[0].include[0].where = {
        ...options.include[0].include[0].where,
        spec: dto.bomSpec,
      }
    }

    switch (dto.timeRange) {
      case '今日':
        options.where = {
          ...options.where,
          actualStartTime: {
            [Op.gte]: dayjs().startOf('day').toDate(),
            [Op.lte]: dayjs().endOf('day').toDate(),
          },
        }
        break
      case '本月':
        options.where = {
          ...options.where,
          actualStartTime: {
            [Op.gte]: dayjs().startOf('month').toDate(),
            [Op.lte]: dayjs().endOf('month').toDate(),
          },
        }
        break
      case '全部':
        options.where = {
          ...options.where,
        }
        break
    }
    const result = await Paging.diyPaging(ProductionOrder, pagination, options)
    for (let i = 0; i < result.data.length; i++) {
      const tasks = result.data[i].tasks
      let badNumber = 0
      let goodNumber = 0
      for (let j = 0; j < tasks.length; j++) {
        badNumber = tasks[j].badCount + badNumber
        goodNumber = tasks[j].goodCount + goodNumber
      }
      result.data[i].setDataValue('goodNumber', goodNumber)
      result.data[i].setDataValue('badNumber', badNumber)
    }
    return result
  }

  async export(dto: FindPaginationDto, loadModel) {
    const options: FindPaginationOptions = {
      where: {},
      attributes: ['remark'],
      include: [
        {
          where: {},
          association: 'bom',
          attributes: ['code'],
          include: [
            {
              where: {},
              association: 'parentMaterial',
              attributes: ['name', 'spec', 'attr', 'unit', 'code'],
            },
          ],
        },
        {
          association: 'tasks',
          attributes: ['goodCount', 'badCount'],
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
      options.include[0].include[0].where = {
        ...options.include[0].include[0].where,
        name: dto.bomName,
      }
    }
    if (dto.bomSpec) {
      options.include[0].include[0].where = {
        ...options.include[0].include[0].where,
        spec: dto.bomSpec,
      }
    }

    switch (dto.timeRange) {
      case '今日':
        options.where = {
          ...options.where,
          actualStartTime: {
            [Op.gte]: dayjs().startOf('day').toDate(),
            [Op.lte]: dayjs().endOf('day').toDate(),
          },
        }
        break
      case '本月':
        options.where = {
          ...options.where,
          actualStartTime: {
            [Op.gte]: dayjs().startOf('month').toDate(),
            [Op.lte]: dayjs().endOf('month').toDate(),
          },
        }
        break
      case '全部':
        options.where = {
          ...options.where,
        }
        break
    }

    const result = await ProductionOrder.findAll(options)
    const style: Partial<Style> = {
      alignment: {
        horizontal: 'center',
      },
    }

    const columns: Array<Partial<Column>> = [
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
        header: '备注',
        key: 'remark',
        width: 20,
        style,
      },
      {
        header: '产品属性',
        key: 'attr',
        width: 20,
        style,
      },
      {
        header: '单位',
        key: 'unit',
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
        header: '不良品数',
        key: 'badCount',
        width: 20,
        style,
      },
    ]

    let dataList = []
    const performanceData = {
      sheetName: '产量统计',
      rows: [],
      columns: columns,
    }
    result.forEach(value => {
      let badNumber = 0
      let goodNumber = 0
      for (let i = 0; i < value.tasks.length; i++) {
        badNumber = value.tasks[i].badCount + badNumber
        goodNumber = value.tasks[i].goodCount + goodNumber
      }
      const temp: any = {
        bomCode: value.bom.parentMaterial.code,
        bomName: value.bom.parentMaterial.materialName,
        bomSpec: value.bom.parentMaterial.spec,
        remark: value.remark,
        attr: value.bom.parentMaterial.attribute,
        unit: value.bom.parentMaterial.unit,
        goodCount: goodNumber,
        badCount: badNumber,
      }
      performanceData.rows.push(temp)
    })
    dataList.push(performanceData)
    return dataList
  }
}
