import { Pagination } from '@common/interface'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Injectable } from '@nestjs/common'
import { CBomDto, FindPaginationDto, UBomDto } from './bom.dto'
import { BOM } from '@model/base/bom.model'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { BomDetail } from '@model/base/bomDetail.model'
import { Aide, JsExclKey } from '@library/utils/aide'
import { Material } from '@model/base/material.model'
import { deleteIdsDto } from '@common/dto'
import { trim } from 'lodash'
import { Organize } from '@model/auth/organize'
import { DefectiveItem } from '@model/quantity/defectiveItem.model'
import { Process } from '@model/process/process.model'
import { ProcessItems } from '@model/process/processItems.model'
import { ProcessDept } from '@model/process/processDept.model'
import { AdjustOrder, TrendsTemplate } from '@model/index'
import { Paging } from '@library/utils/paging'

@Injectable()
export class BomService {
  constructor(
    @InjectModel(BOM)
    private bomModel: typeof BOM
  ) {}

  public async create(dto: CBomDto, loadModel) {
    // const temp = await BOM.findOne({where:{materialId:dto.materialId}})
    const material = await Material.findOne({ where: { id: dto.materialId } })
    if (!material) {
      throw new HttpException('所选择的父项物料不存在', 400)
    }
    // if (temp){
    //   throw new HttpException("该父项物料已存在另一BOM中",400)
    // }
    const bom = await BOM.findOne({ where: { materialId: dto.materialId, parentId: 0 } })
    let version
    if (bom) {
      let versionNum = parseInt(bom.version.substring(1))
      versionNum++
      version = 'v' + versionNum
      dto['version'] = 'v' + versionNum
    } else {
      version = 'v1'
      dto['version'] = 'v1'
    }
    let result = await BOM.create(dto)
    if (dto.items) {
      for (const item of dto.items) {
        if (item.materialId == dto.materialId) {
          throw new HttpException('不能将父项物料作为子物料加入BOM', 400)
        }
        await BOM.create({ parentId: result.id, materialId: item.materialId, version })
      }
    }

    return this.find(result.id, loadModel)
  }

  public async edit(dto: UBomDto, id: number, loadModel) {
    let bom = await BOM.findOne({ where: { id } })
    if (!bom) {
      throw new HttpException('数据不存在', 400006)
    }
    await bom.update(dto)
    if (dto.items) {
      await BOM.destroy({ where: { parentId: id } })
      for (const item of dto.items) {
        if (item.materialId == dto.materialId) {
          throw new HttpException('不能将父项物料作为子物料加入BOM', 400)
        }
        await BOM.create({ parentId: id, materialId: item.materialId })
      }
    }

    return this.find(id, loadModel)
  }

  public async delete(id: number, loadModel) {
    await BomDetail.destroy({ where: { bomId: id } })
    const result = await BOM.destroy({
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
          association: 'parentMaterial',
          attributes: ['id', 'materialName', 'remark'],
          include: [
            {
              association: 'processRoute',
              attributes: ['id', 'name', 'remark', 'status'],
              where: { status: true },
            },
          ],
        },
      ],
    }
    const result = await BOM.findOne(options)
    const res = await this.getBomWithChildren(result)

    return res
  }
  private async getBomWithChildren(bom: BOM) {
    // 获取子 BOM 子项
    const children = await BomDetail.findAll({
      where: { bomId: bom.id }, // 找到当前 BOM 的子项
      attributes: ['id', 'sort', 'bomId', 'materialId', 'spec', 'attr', 'unit', 'quantity', 'feedProcessId', 'figureNumber', 'subBomCode'], // 正确的字段
      include: [
        {
          association: 'parentMaterial', // 对应定义的 material 关联
          attributes: ['id', 'code', 'attribute', 'category', 'materialName', 'spec', 'unit', 'status', 'k3DataStatus'],
        },
      ],
    })

    // 构建子项中的子 BOM 数据
    const childBoms = await Promise.all(
      children.map(async child => {
        // 查找是否还有对应的子 BOM
        const childBom = await BOM.findOne({
          where: { materialId: child.materialId }, // 找到当前 BOM 的子项
          attributes: ['id', 'code', 'materialId', 'spec', 'attr', 'unit', 'quantity', 'orderNo', 'figureNumber', 'remark', 'version', 'status', 'formData'],
        })
        if (childBom) {
          return await this.getBomWithChildren(childBom) // 递归获取子 BOM
        }
        return null
      })
    )

    // 移除无效值并构建最终结果
    const bomWithChildren = {
      ...bom.toJSON(),
      items: children.map((child, index) => ({
        ...child.toJSON(),
        items: childBoms[index] || null, // 绑定子 BOM 数据
      })),
    }

    return bomWithChildren
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, loadModel) {
    const options: FindPaginationOptions = {
      where: { parentId: 0 },
      pagination,
      order: [['id', 'DESC']],
      attributes: ['id', 'code', 'materialId', 'spec', 'attr', 'unit', 'quantity', 'orderNo', 'figureNumber', 'remark', 'version', 'status', 'formData'],
      include: [
        {
          association: 'parentMaterial',
          attributes: ['id', 'code', 'attribute', 'category', 'materialName', 'spec', 'unit', 'status', 'k3DataStatus'],
          where: {},
        },
      ],
    }
    if (dto.default) {
      options.include[0].where['name'] = {
        [Op.like]: `%${dto.default}%`,
      }
      options.include[0].where['code'] = {
        [Op.like]: `%${dto.default}%`,
      }
    }

    if (dto.name) {
      options.include[0].where['name'] = {
        [Op.like]: `%${dto.name}%`,
      }
    }
    if (dto.code) {
      options.include[0].where['code'] = {
        [Op.like]: `%${dto.code}%`,
      }
    }
    if (dto.attr) {
      const temp = dto.attr.split(',')
      options.include[0].where['attr'] = {
        [Op.in]: temp,
      }
    }
    if (dto.spec) {
      options.include[0].where['spec'] = {
        [Op.like]: `%${dto.spec}%`,
      }
    }
    if (dto.unit) {
      options.include[0].where['unit'] = {
        [Op.like]: `%${dto.unit}%`,
      }
    }

    const result = await Paging.diyPaging(BOM, pagination, options)
    // 遍历每个根 BOM 并递归获取其子 BOM
    // const res = await Promise.all(
    //   // @ts-ignore
    //   result.data.map(async bom => {
    //     const bomWithChildren = await this.getBomWithChildren(bom)
    //     return bomWithChildren
    //   })
    // )
    // // @ts-ignore
    // result.data = res
    return result
  }

  public async importExcel(buffer: Buffer, loadModel) {
    const mapper: JsExclKey[] = [
      {
        keyName: '父项物料编码', // 假定Excel中有一个列是父物料编码
        key: 'parentMaterialCode', // 对应BOM类中的父物料Id
      },
      {
        keyName: '备注',
        key: 'remark',
      },
      {
        keyName: '子项物料编号', // 假定Excel中有一个列是父物料编码
        key: 'subMaterialCode', // 对应BOM类中的父物料Id
      },
      {
        keyName: '动态字段集合', // Excel列的名称
        key: 'formData', // Supplier类中的属性名
      },
      {
        keyName: '单位用量',
        key: 'quantity',
      },
    ]
    let result = {}
    let bomSuccess = 0
    let bomUpdate = 0
    let bomFailed = 0
    let total = 0

    // 将当前Sheet的数据转换为JSON
    const json = await Aide.excelToJson(buffer, mapper)
    const trendsFieldDatas = await TrendsTemplate.findOne({
      where: { code: 'bom' },
      include: [
        {
          association: 'trendsFieldDatas',
          attributes: ['id', 'name', 'types', 'state', 'len', 'sort', 'tip', 'fieldOption'],
          order: ['sort'],
        },
      ],
    })

    const sequelize = BOM.sequelize
    return sequelize.transaction(async transaction => {
      try {
        // 遍历每行数据并保存到数据库
        let codeList = []
        for (const rowElement of json.row) {
          if (codeList.indexOf(trim(rowElement.parentMaterialCode)) < 0) {
            codeList.push(trim(rowElement.parentMaterialCode))
            total++
          }

          if (rowElement.parentMaterialCode) {
            //找出父物料
            const material = await Material.findOne({ where: { code: trim(rowElement.parentMaterialCode) } })
            if (trendsFieldDatas) {
              let trendsDatas = JSON.stringify(trendsFieldDatas.trendsFieldDatas)
              let formData = await Aide.excelAddFormData(trendsDatas, rowElement.formData)
              rowElement.formData = formData
            }
            //找出是否有BOM匹配
            let temp
            if (material) {
              temp = await BOM.findOne({ where: { materialId: material.id, parentId: 0 }, order: [['id', 'DESC']], transaction })
            } else {
              if (!material) throw new HttpException('未有报错文案,请完善报错清单文档', 400)
              bomFailed++
              continue
            }
            let version
            if (temp && temp.version) {
              let versionNum = parseInt(temp.version.substring(1))
              versionNum++
              version = 'v' + versionNum
            } else {
              version = 'v1'
            }
            if (!temp) {
              temp = await BOM.create(
                { materialId: material.id, remark: trim(rowElement.remark), parentId: 0, version},
                { transaction }
              )
            }

            if (rowElement.subMaterialCode) {
              // const parent = await Material.findOne({ where: { code: trim(rowElement.parentMaterialCode) }})
              // if(!parent){
              //   bomFailed++
              //   throw new HttpException("未有报错文案,请完善报错清单文档",400)
              // }
              const parentBOM = await BOM.findOne({ where: { materialId: material.id, parentId: 0 }, order: [['id', 'DESC']], transaction })
              const sub = await Material.findOne({ where: { code: trim(rowElement.subMaterialCode) }, transaction })
              if (!sub) {
                bomFailed++
                throw new HttpException('未有报错文案,请完善报错清单文档', 400)
              }
              await BOM.create(
                { parentId: temp.id, materialId: sub.id, remark: trim(rowElement.remark), version: parentBOM.version },
                { transaction }
              )
            }
          } else {
            bomFailed++
          }
        }
        result = { total, success: codeList.length, update: bomUpdate, failed: bomFailed }
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
        const deleteBom = await BOM.destroy({ where: { id } })
        const deleteBomItem = await BomDetail.destroy({ where: { bomId: id } })
        if (deleteBom) {
          success++
        } else {
          failed++
        }
      } catch (e) {
        errors.push(`删除BOM ID ${id} 时出错: ${e.message}`)
        failed++
      }
    }
    return { success, failed }
  }
}
