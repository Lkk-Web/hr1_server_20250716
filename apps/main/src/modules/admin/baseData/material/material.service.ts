import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import { Material } from '@model/base/material.model'
import { CMaterialDto, FindByWarehouseDto, FindPaginationDto, UMaterialDto } from './material.dto'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { Aide, JsExclKey } from '@library/utils/aide'
import { deleteIdsDto } from '@common/dto'
import { BOM } from '@model/base/bom.model'
import { TrendsTemplate, Warehouse, WarehouseMaterial } from '@model/index'
import { Paging } from '@library/utils/paging'

@Injectable()
export class MaterialService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: Redis,
    @InjectModel(Material)
    private materialModel: typeof Material
  ) {}

  public async create(dto: CMaterialDto, loadModel) {
    if (dto.code) {
      const same = await Material.findOne({ where: { code: dto.code } })
      if (same) throw new HttpException('已存在相同编号物料', 400)
    }
    if (!dto.code || dto.code.length === 0) {
      const temp = await Material.findOne({
        order: [['id', 'DESC']],
        where: { code: { [Op.like]: `M%` } },
      })
      if (temp) {
        const oldNO = temp.code
        const lastFourChars = oldNO.length >= 4 ? oldNO.slice(-4) : '0'.repeat(4 - oldNO.length) + oldNO
        let num = parseInt(lastFourChars)
        num++
        let newNO = num.toString().padStart(4, '0')

        dto.code = 'M' + newNO
      } else {
        dto.code = 'M1001'
      }
    }

    const temp = await Material.findOne({ where: { materialName: dto.name, spec: dto.spec ? dto.spec : null, attribute: dto.attr } })
    if (temp) {
      throw new HttpException('同种物料已存在!', 400)
    }

    const result = await Material.create(dto)
    return result
  }

  public async edit(dto: UMaterialDto, id: number, loadModel) {
    let material = await Material.findOne({ where: { id } })
    if (!material) {
      throw new HttpException('数据不存在', 400006)
    }
    const temp = await Material.findOne({
      where: {
        materialName: dto.name,
        spec: dto.spec ? dto.spec : null,
        attribute: dto.attr,
        id: { [Op.ne]: id },
      },
    })
    if (temp) {
      throw new HttpException('同种物料已存在!', 400)
    }

    await material.update(dto)
    material = await Material.findOne({ where: { id } })
    return material
  }

  public async delete(id: number, loadModel) {
    // const pro = await ProcessRoute.findOne({ where: { materialId: id } })
    // if (pro) {
    //   const material = await Material.findByPk(id)
    //   throw new HttpException('该物料已存在后续业务数据（如BOM\\工艺路线、工单\\任务单\\报工等），不允许删除！', 400)
    // }

    const temp = await BOM.findOne({ where: { materialId: id } })
    if (temp) {
      const material = await Material.findByPk(id)
      throw new HttpException('该物料已存在后续业务数据（如BOM\\工艺路线、工单\\任务单\\报工等），不允许删除！', 400)
    }
    const result = await Material.destroy({
      where: {
        id: id,
      },
    })
    return result
  }

  public async find(id: number, loadModel) {
    const options: FindOptions = {
      where: { id },
      include: [
        {
          association: 'processRoute',
          where: { status: true },
          required: false,
        },
      ],
    }
    const result = await Material.findOne(options)
    result.setDataValue('processRouteId', result.dataValues.processRoute ? result.dataValues.processRoute.id : null)
    return result
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, loadModel) {
    const options: FindPaginationOptions = {
      where: {},
      // attributes: ['id', 'code', 'attr', 'category', 'name', 'createdAt', 'spec', 'updatedAt', 'unit', 'status', 'remark', 'formData', 'k3DrawingNo', 'k3StandardDrawingNo', 'k3Meterial', 'k3AuxUinit', 'k3Color', 'k3DataStatus', 'minimumInventory', 'maximumInventory', 'safetyInventory', 'quantity', 'batNumber'],
      pagination,
      order: [['id', 'DESC']],
      include: [
        {
          association: 'processRoute',
          attributes: ['id', 'name'],
          where: { status: true },
          required: false,
        },
      ],
    }
    if (dto.filterCode && (dto.filterCode.indexOf(dto.code) === 0 || dto.filterCode.indexOf(dto.code) > 0)) {
      return { data: [], current: 1, pageSize: 10, pageCount: 0, total: 0 }
    }

    if (dto.filterCode) {
      options.where['code'] = {
        [Op.notIn]: dto.filterCode,
      }
    }
    if (dto.default) {
      options.where[Op.or] = [{ materialName: { [Op.like]: `%${dto.default}%` } }, { code: { [Op.like]: `%${dto.default}%` } }]
    }
    if (dto.name) {
      options.where['materialName'] = {
        [Op.like]: `%${dto.name}%`,
      }
    }

    if (dto.code) {
      options.where['code'] = {
        [Op.like]: `%${dto.code}%`,
      }
    }
    if (dto.attribute) {
      const temp = dto.attribute.split(',')
      options.where['attribute'] = {
        [Op.in]: temp,
      }
    }
    if (dto.spec) {
      options.where['spec'] = {
        [Op.like]: `%${dto.spec}%`,
      }
    }
    if (dto.unit) {
      options.where['unit'] = {
        [Op.like]: `%${dto.unit}%`,
      }
    }

    if (dto.status) {
      const statusString = String(dto.status).toLowerCase().trim() // 确保字符串统一处理
      const statusBoolean = statusString === 'true' || statusString === '1' // 转换逻辑
      options.where['status'] = {
        [Op.eq]: statusBoolean,
      }
    }

    if (dto.hasBom) {
      //查询是否存在BOM
      options.include = [
        {
          association: 'boms',
          where: { parentId: 0 },
          required: true,
        },
        {
          association: 'processRoute',
          attributes: ['id', 'name'],
          where: { status: true },
        },
      ]
    }

    if (dto.category) {
      options.where['category'] = {
        [Op.eq]: dto.category,
      }
    }
    const result = await Paging.diyPaging(Material, pagination, options)

    if (dto.warehouseId) {
      // @ts-ignore
      for (const datum of result.data) {
        const warehouseMaterial = await WarehouseMaterial.findOne({
          where: {
            warehouseId: dto.warehouseId,
            materialId: datum.id,
          },
        })
        datum.setDataValue('warehouseCount', warehouseMaterial ? warehouseMaterial.count : 0)
      }
    }
    for (const datum of result.data) {
      datum.setDataValue('processRouteId', datum.dataValues.processRoute ? datum.dataValues.processRoute.id : null)
    }
    return result
  }

  public async importExcel(buffer: Buffer, loadModel) {
    const mapper: JsExclKey[] = [
      {
        keyName: '物料编码', // Excel列的名称
        key: 'code', // 物料Model类中的属性名
      },
      {
        keyName: '物料名称',
        key: 'name',
      },
      {
        keyName: '物料规格',
        key: 'spec',
      },
      {
        keyName: '物料属性',
        key: 'attr',
      },
      {
        keyName: '单位',
        key: 'unit',
      },
      {
        keyName: '物料类别',
        key: 'category',
      },
      {
        keyName: '状态', // 启用/禁用
        key: 'status',
      },
      {
        keyName: '备注',
        key: 'remark',
      },
      {
        keyName: '启用批号管理',
        key: 'batNumber',
      },
    ]
    let result = {}
    let materialSuccess = 0
    let materialUpdate = 0
    let materialFailed = 0
    let total = 0

    // 将当前Sheet的数据转换为JSON
    const json = await Aide.excelToJson(buffer, mapper)
    const trendsFieldDatas = await TrendsTemplate.findOne({
      where: { code: 'material' },
      include: [
        {
          association: 'trendsFieldDatas',
          attributes: ['id', 'name', 'types', 'state', 'len', 'sort', 'tip', 'fieldOption'],
          order: ['sort'],
        },
      ],
    })

    const sequelize = Material.sequelize
    return sequelize.transaction(async transaction => {
      try {
        // 遍历每行数据并保存到数据库
        for (const rowElement of json.row) {
          if (rowElement.code) {
            if (trendsFieldDatas) {
              let trendsDatas = JSON.stringify(trendsFieldDatas.trendsFieldDatas)
              let formData = await Aide.excelAddFormData(trendsDatas, rowElement.formData)
              rowElement.formData = formData
            }
            if (!rowElement.name || !rowElement.attr) {
              throw new HttpException('导入模板格式错误，请使用系统导入模板重新导入！', 400)
            }
            if (rowElement.batNumber === '是') {
              rowElement.batNumber = true
            } else {
              rowElement.batNumber = false
            }
            const temp = await Material.findOne({ where: { code: rowElement.code }, transaction })
            if (temp) {
              await Material.update({ ...rowElement }, { where: { id: temp.id }, transaction })
              materialUpdate++
            } else {
              const temp = await Material.findOne({
                where: {
                  materialName: rowElement.name,
                  spec: rowElement.spec,
                  attribute: rowElement.attr,
                },
                transaction,
              })
              if (temp) {
                throw new HttpException('同种物料已存在!', 400)
              }

              await Material.create({ ...rowElement }, { transaction })
              materialSuccess++
            }
          } else {
            if (trendsFieldDatas) {
              let trendsDatas = JSON.stringify(trendsFieldDatas.trendsFieldDatas)
              let formData = await Aide.excelAddFormData(trendsDatas, rowElement.formData)
              rowElement.formData = formData
            }
            const temp = await Material.findOne({
              order: [['id', 'DESC']],
              where: { code: { [Op.like]: `M%` } },
            })
            if (temp) {
              const oldNO = temp.code
              const lastFourChars = oldNO.length >= 4 ? oldNO.slice(-4) : '0'.repeat(4 - oldNO.length) + oldNO
              let num = parseInt(lastFourChars)
              num++
              let newNO = num.toString().padStart(4, '0')

              rowElement.code = 'M' + newNO
            } else {
              rowElement.code = 'M1001'
            }
            const temp1 = await Material.findOne({
              where: {
                materialName: rowElement.name,
                spec: rowElement.spec,
                attribute: rowElement.attr,
              },
              transaction,
            })
            if (temp1) {
              throw new HttpException('同种物料已存在!', 400)
            }
            await Material.create({ ...rowElement }, { transaction })
          }
          total++
        }
        result = { total, success: materialSuccess, update: materialUpdate, failed: materialFailed }
        return result
      } catch (error) {
        // 如果出现错误，Sequelize 将自动回滚事务
        throw error
      }
    })
  }

  public async batDelete(dto: deleteIdsDto, loadModel) {
    let success = 0
    let failed = 0
    let errors: Array<string> = []
    for (const id of dto.ids) {
      try {
        const temp = await BOM.findOne({ where: { materialId: id } })
        if (temp) {
          const material = await Material.findByPk(id)
          errors.push(`物料: ${material.materialName} 为关键物料, 无法删除, 请先将该物料从BOM中移除`)
        }
        const deleteNum = await Material.destroy({ where: { id } })
        if (deleteNum) {
          success++
        } else {
          failed++
        }
      } catch (e) {
        errors.push(`删除物料 ID ${id} 时出错: ${e.message}`)
        failed++
      }
    }
    return { success, failed, errors }
  }

  public async findByWarehouse(dto: FindByWarehouseDto, loadModel) {
    let result = []
    const warehouse = await Warehouse.findByPk(dto.warehouseId)
    for (const materialId of dto.materialIds) {
      const material = await Material.findByPk(materialId)
      if (warehouse && material) {
        const sum = await WarehouseMaterial.findOne({
          where: {
            warehouseId: dto.warehouseId,
            materialId: materialId,
          },
        })
        if (sum && sum.count > 0) {
          material.setDataValue('warehouseCount', sum?.count)
        } else {
          material.setDataValue('warehouseCount', 0)
        }
        result.push(material)
      }
    }
    return result
  }
}
