import { Pagination } from '@common/interface'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Injectable } from '@nestjs/common'
import { CPerformanceDetailedDto, FindPaginationDto, UPerformanceDetailedDto } from './performanceDetailed.dto'
import { FindOptions, Op, QueryTypes } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { Aide, JsExclKey } from '@library/utils/aide'
import { deleteIdsDto } from '@common/dto'
import { PerformanceDetailed, TrendsTemplate } from '@model/index'
import dayjs = require('dayjs')
import { Paging } from '@library/utils/paging'

@Injectable()
export class PerformanceDetailedService {
  constructor(
    @InjectModel(PerformanceDetailed)
    private performanceDetailedModel: typeof PerformanceDetailed
  ) { }

  public async create(dto: CPerformanceDetailedDto, loadModel) {
    const result = await PerformanceDetailed.create(dto)
    return result
  }

  public async edit(dto: UPerformanceDetailedDto, id: number, loadModel) {
    let performanceDetailed = await PerformanceDetailed.findOne({ where: { id } })
    if (!performanceDetailed) {
      throw new HttpException('数据不存在', 400006)
    }
    await performanceDetailed.update(dto)
    performanceDetailed = await PerformanceDetailed.findOne({ where: { id } })
    return performanceDetailed
  }

  public async delete(id: number, loadModel) {
    const result = await PerformanceDetailed.destroy({
      where: {
        id: id,
      },
    })
    return result
  }

  public async find(id: number, loadModel) {
    const options: FindOptions = { where: { id }, include: [{ all: true }] }
    const result = await PerformanceDetailed.findOne(options)
    return result
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, loadModel) {
    const options: FindPaginationOptions = {
      where: { performanceId: dto.performanceId },
      include: [
        {
          association: 'material',
          attributes: ['id', 'name', 'code', 'attr', 'spec', 'unit'],
        },
        {
          association: 'process',
          attributes: ['id', 'processName'],
        },
        {
          association: 'productionOrder',
          attributes: ['id', 'code'],
        },
      ],
      pagination,
    }
    if (dto.startTime) {
      options.where['createdAt'] = { [Op.gte]: dayjs(dto.startTime).format('YYYY-MM-DD 00:00:00') }
    }
    if (dto.endTime) {
      if (dto.startTime) {
        options.where['createdAt'][Op.lte] = dayjs(dto.endTime).format('YYYY-MM-DD 23:59:59')
      } else {
        options.where['createdAt'] = { [Op.lte]: dayjs(dto.endTime).format('YYYY-MM-DD 23:59:59') }
      }
    }

    // if (dto.fullName) {
    //   options.where['fullName'] = {
    //     [Op.like]: `%${dto.fullName}%`,
    //   }
    // }

    // if (dto.shortName) {
    //   options.where['shortName'] = {
    //     [Op.like]: `%${dto.shortName}%`,
    //   }
    // }

    // if (dto.address) {
    //   options.where['address'] = {
    //     [Op.like]: `%${dto.address}%`,
    //   }
    // }

    // if (dto.contactPhone) {
    //   options.where['contactPhone'] = {
    //     [Op.like]: `%${dto.contactPhone}%`,
    //   }
    // }

    // if (dto.contactPerson) {
    //   options.where['contactPerson'] = {
    //     [Op.like]: `%${dto.contactPerson}%`,
    //   }
    // }
    const result = await Paging.diyPaging(PerformanceDetailed, pagination, options);
    return result
  }

  // public async importExcel(buffer: Buffer) {
  //   const mapper: JsExclKey[] = [
  //     {
  //       keyName: '编码',  // Excel列的名称
  //       key: 'code',      // PerformanceDetailed类中的属性名
  //     },
  //     {
  //       keyName: '供应商名称', // Excel列的名称
  //       key: 'shortName',  // PerformanceDetailed类中的属性名
  //     },
  //     {
  //       keyName: '供应商全称', // Excel列的名称
  //       key: 'fullName',   // PerformanceDetailed类中的属性名
  //     },
  //     {
  //       keyName: '联系人',  // Excel列的名称
  //       key: 'contactPerson', // PerformanceDetailed类中的属性名
  //     },
  //     {
  //       keyName: '联系电话', // Excel列的名称
  //       key: 'contactPhone', // PerformanceDetailed类中的属性名
  //     },
  //     {
  //       keyName: '联系地址', // Excel列的名称
  //       key: 'address',      // PerformanceDetailed类中的属性名
  //     },
  //     {
  //       keyName: '动态字段集合', // Excel列的名称
  //       key: 'formData',      // PerformanceDetailed类中的属性名
  //     }
  //   ]
  //   let result = {}
  //   let performanceDetailedSuccess = 0
  //   let performanceDetailedUpdate = 0
  //   let performanceDetailedFailed = 0
  //   let total = 0

  //   // 将当前Sheet的数据转换为JSON
  //   const json = await Aide.excelToJson(buffer, mapper)
  //   const trendsFieldDatas = await TrendsTemplate.findOne({
  //     where: { code: 'performanceDetailed' },
  //     include: [
  //       {
  //         association: "trendsFieldDatas",
  //         attributes: ['id', 'name', 'types', 'state', 'len', 'sort', 'tip', 'fieldOption'],
  //         order: ['sort']
  //       },
  //     ],
  //   })
  //   // 遍历每行数据并保存到数据库
  //   for (let rowElement of json.row) {
  //     let temp
  //     if (rowElement.shortName && rowElement.fullName) {
  //       if (trendsFieldDatas) {
  //         let trendsDatas = JSON.stringify(trendsFieldDatas.trendsFieldDatas)
  //         let formData = await Aide.excelAddFormData(trendsDatas, rowElement.formData)
  //         rowElement.formData = formData
  //       }
  //       temp = await PerformanceDetailed.findOne({ where: { shortName: rowElement.shortName } })
  //       if (temp) {
  //         await PerformanceDetailed.update({ ...rowElement }, { where: { id: temp.id } })
  //         performanceDetailedUpdate++
  //       } else if (rowElement.fullName) {
  //         temp = await PerformanceDetailed.findOne({ where: { shortName: rowElement.fullName } })
  //         if (!temp) {
  //           await PerformanceDetailed.create(rowElement)
  //           performanceDetailedSuccess++
  //         }
  //       }
  //     } else {
  //       performanceDetailedFailed++
  //     }
  //     total++
  //   }
  //   result = { total, success: performanceDetailedSuccess, update: performanceDetailedUpdate, failed: performanceDetailedFailed }
  //   return result
  // }

  public async batDelete(dto: deleteIdsDto, loadModel) {
    let success = 0
    let failed = 0
    let errors: Array<string> = []
    for (const id of dto.ids) {
      try {
        const deleteNum = await PerformanceDetailed.destroy({ where: { id } })
        if (deleteNum) {
          success++
        } else {
          failed++
        }
      } catch (e) {
        errors.push(`删除供应商 ID ${id} 时出错: ${e.message}`)
        failed++
      }
    }
    return { success, failed }
  }
}
