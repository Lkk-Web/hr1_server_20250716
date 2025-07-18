import { Pagination } from '@common/interface'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Injectable } from '@nestjs/common'
import { CPerformanceConfigDto, FindPaginationDto, UPerformanceConfigDto } from './performanceConfig.dto'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { Aide, JsExclKey } from '@library/utils/aide'
import { deleteIdsDto } from '@common/dto'
import { Material, PerformanceConfig, Process, Supplier, TrendsTemplate } from '@model/index'
import { trim } from 'lodash'
import { ResultVO } from '@common/resultVO'
import { Paging } from '@library/utils/paging'

@Injectable()
export class PerformanceConfigService {
  constructor(
    @InjectModel(PerformanceConfig)
    private performanceConfigModel: typeof PerformanceConfig
  ) { }

  public async create(dto: CPerformanceConfigDto, loadModel) {
    if (dto.processId) {
      const temp = await PerformanceConfig.findOne({ where: { processId: dto.processId, materialId: dto.materialId } })
      if (temp) {
        throw new HttpException('该工序已存在绩效工资配置！', 400)
      }
    }
    const result = await PerformanceConfig.create(dto)
    return result
  }

  public async edit(dto: UPerformanceConfigDto, id: number, loadModel) {
    let performanceConfig = await PerformanceConfig.findOne({ where: { id } })
    if (!performanceConfig) {
      throw new HttpException('数据不存在', 400006)
    }
    if (dto.processId != performanceConfig.processId) {
      const temp = await PerformanceConfig.findOne({ where: { processId: dto.processId, materialId: dto.materialId } })
      if (temp) {
        throw new HttpException('该工序已存在绩效工资配置！', 400)
      }
    }
    await performanceConfig.update(dto)
    performanceConfig = await PerformanceConfig.findOne({ where: { id } })
    return performanceConfig
  }

  public async delete(id: number, loadModel) {
    const result = await PerformanceConfig.destroy({
      where: {
        id: id,
      },
    })
    return result
  }

  public async find(id: number, loadModel) {
    const options: FindOptions = { where: { id }, include: [{ all: true }] }
    const result = await PerformanceConfig.findOne(options)
    return result
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, loadModel) {
    const options: FindPaginationOptions = {
      where: {},
      include: [
        {
          association: 'material',
          attributes: ['id', 'name', 'code', 'attr', 'spec', 'unit'],
        },
        {
          association: 'process',
          attributes: ['id', 'processName'],
        },
      ],
      pagination,
    }

    // if (dto.default) {
    //   options['include'][0]['where'] = {
    //     [Op.or]: [{ name: `%${dto.default}%` }]
    //   }
    //   options['include'][1]['where'] = {
    //     [Op.or]: [{ processName: `%${dto.default}%` }]
    //   }
    // }

    if (dto.materialName) {
      options['include'][0]['where'] = {
        name: { [Op.like]: `%${dto.materialName}%` },
      }
    }

    if (dto.processName) {
      options['include'][1]['where'] = {
        processName: { [Op.like]: `%${dto.processName}%` },
      }
    }
    if (dto.pricingMethod) {
      options.where = {
        pricingMethod: { [Op.eq]: `${dto.pricingMethod}` },
      }
    }
    const result = await Paging.diyPaging(PerformanceConfig, pagination, options);
    return result
  }

  public async importExcel(buffer: Buffer, loadModel) {
    const mapper: JsExclKey[] = [
      {
        keyName: '物料编码', // Excel列的名称
        key: 'materialCode', // Performance类中的属性名
      },
      {
        keyName: '工序名称', // Excel列的名称
        key: 'processName', // Performance类中的属性名
      },
      {
        keyName: '计价方式', // Excel列的名称
        key: 'pricingMethod', // Performance类中的属性名
      },
      {
        keyName: '良品单价（元）', // Excel列的名称
        key: 'goodCountPrice', // Performance类中的属性名
      },
      {
        keyName: '不良品单价（元）', // Excel列的名称
        key: 'badCountPrice', // Performance类中的属性名
      },
      {
        keyName: '标准工时（小时）', // Excel列的名称
        key: 'canonTime', // Performance类中的属性名
      },
      {
        keyName: '标准产出', // Excel列的名称
        key: 'canonNum', // Performance类中的属性名
      },
    ]
    let result = {}
    let performanceConfigSuccess = 0
    let performanceConfigUpdate = 0
    let performanceConfigFailed = 0
    let total = 0

    // 将当前Sheet的数据转换为JSON
    let json = await Aide.excelToJson(buffer, mapper)
    // 遍历每行数据并保存到数据库
    for (let rowElement of json.row) {
      total++
      let temp
      if (rowElement.materialCode) {
        const material = await Material.findOne({ where: { code: trim(rowElement.materialCode) } })
        const process = await Process.findOne({ where: { processName: trim(rowElement.processName) } })
        if (material && process) {
          temp = await PerformanceConfig.findOne({ where: { materialId: material.id, processId: process.id }, order: [['id', 'DESC']] })
        } else {
          performanceConfigFailed++
          continue
        }
        delete rowElement.materialCode
        delete rowElement.processName
        let newData = {
          materialId: material.id,
          processId: process.id,
          pricingMethod: rowElement.pricingMethod ? rowElement.pricingMethod : '计件',
          goodCountPrice: rowElement.goodCountPrice ? rowElement.goodCountPrice * 10000 : 10000,
          badCountPrice: rowElement.badCountPrice ? rowElement.badCountPrice * 10000 : 10000,
          canonTime: rowElement.canonTime ? rowElement.canonTime * 60 * 60 : 3600,
          canonNum: rowElement.canonNum ? rowElement.canonNum : 1,
        }
        if (temp) {
          await PerformanceConfig.update(newData, { where: { id: temp.id } })
          performanceConfigUpdate++
        } else {
          await PerformanceConfig.create(newData)
          performanceConfigSuccess++
        }
      } else {
        performanceConfigFailed++
      }
    }
    result = { total, success: performanceConfigSuccess, update: performanceConfigUpdate, failed: performanceConfigFailed }
    return result
  }

  public async batDelete(dto: deleteIdsDto, loadModel) {
    let success = 0
    let failed = 0
    let errors: Array<string> = []
    for (const id of dto.ids) {
      try {
        const deleteNum = await PerformanceConfig.destroy({ where: { id } })
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

  public async copy(id: number, loadModel) {
    const config = await PerformanceConfig.findByPk(id)
    if (config) {
      const data = await PerformanceConfig.create({
        pricingMethod: config.pricingMethod,
        goodCountPrice: config.goodCountPrice,
        canonTime: config.canonTime,
        canonNum: config.canonNum,
      })
      return new ResultVO({ data })
    } else {
      throw new HttpException('未找到指定绩效配置，请刷新页面。', 400)
    }
  }
}
