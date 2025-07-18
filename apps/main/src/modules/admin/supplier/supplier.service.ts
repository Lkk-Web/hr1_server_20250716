import { Pagination } from '@common/interface'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Injectable } from '@nestjs/common'
import { Supplier } from '@model/base/supplier.model'
import { CSupplierDto, FindPaginationDto, USupplierDto } from './supplier.dto'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { Aide, JsExclKey } from '@library/utils/aide'
import { deleteIdsDto } from '@common/dto'
import { FileList, TrendsTemplate } from '@model/index'
import { Paging } from '@library/utils/paging'

@Injectable()
export class SupplierService {
  constructor(
    @InjectModel(Supplier)
    private supplierModel: typeof Supplier
  ) {}

  public async create(dto: CSupplierDto, loadModel) {
    if (dto.fullName) {
      const temp = await Supplier.findOne({ where: { fullName: dto.fullName } })
      if (temp) {
        throw new HttpException('该全称供应商已存在', 400)
      }
    }
    const result = await Supplier.create(dto)
    return result
  }

  public async edit(dto: USupplierDto, id: number, loadModel) {
    let supplier = await Supplier.findOne({ where: { id } })
    if (!supplier) {
      throw new HttpException('数据不存在', 400006)
    }
    if (dto.fullName != supplier.fullName) {
      const temp = await Supplier.findOne({ where: { fullName: dto.fullName } })
      if (temp) {
        throw new HttpException('该全称供应商已存在', 400)
      }
    }
    await supplier.update(dto)
    supplier = await Supplier.findOne({ where: { id } })
    return supplier
  }

  public async delete(id: number, loadModel) {
    const result = await Supplier.destroy({
      where: {
        id: id,
      },
    })
    return result
  }

  public async find(id: number, loadModel) {
    const options: FindOptions = {
      where: { id },
      attributes: ['id', 'code', 'shortName', 'fullName', 'contactPerson', 'contactPhone', 'address', 'status', 'formData'],
    }
    const result = await Supplier.findOne(options)
    return result
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, loadModel) {
    const options: FindPaginationOptions = {
      where: {},
      attributes: ['id', 'code', 'shortName', 'fullName', 'contactPerson', 'contactPhone', 'address', 'status', 'formData'],
      pagination,
      order: [['id', 'DESC']],
    }
    if (dto.default) {
      options.where = {
        [Op.or]: [
          {
            fullName: { [Op.like]: `%${dto.default}%` },
          },
          {
            shortName: { [Op.like]: `%${dto.default}%` },
          },
          {
            address: { [Op.like]: `%${dto.default}%` },
          },
          {
            contactPhone: { [Op.like]: `%${dto.default}%` },
          },
        ],
      }
    }

    if (dto.fullName) {
      options.where['fullName'] = {
        [Op.like]: `%${dto.fullName}%`,
      }
    }

    if (dto.shortName) {
      options.where['shortName'] = {
        [Op.like]: `%${dto.shortName}%`,
      }
    }

    if (dto.address) {
      options.where['address'] = {
        [Op.like]: `%${dto.address}%`,
      }
    }

    if (dto.contactPhone) {
      options.where['contactPhone'] = {
        [Op.like]: `%${dto.contactPhone}%`,
      }
    }

    if (dto.contactPerson) {
      options.where['contactPerson'] = {
        [Op.like]: `%${dto.contactPerson}%`,
      }
    }
    const result = await Paging.diyPaging(Supplier, pagination, options)
    return result
  }

  public async importExcel(buffer: Buffer, loadModel) {
    const mapper: JsExclKey[] = [
      {
        keyName: '编码', // Excel列的名称
        key: 'code', // Supplier类中的属性名
      },
      {
        keyName: '供应商名称', // Excel列的名称
        key: 'shortName', // Supplier类中的属性名
      },
      {
        keyName: '供应商全称', // Excel列的名称
        key: 'fullName', // Supplier类中的属性名
      },
      {
        keyName: '联系人', // Excel列的名称
        key: 'contactPerson', // Supplier类中的属性名
      },
      {
        keyName: '联系电话', // Excel列的名称
        key: 'contactPhone', // Supplier类中的属性名
      },
      {
        keyName: '联系地址', // Excel列的名称
        key: 'address', // Supplier类中的属性名
      },
      {
        keyName: '动态字段集合', // Excel列的名称
        key: 'formData', // Supplier类中的属性名
      },
    ]
    let result = {}
    let supplierSuccess = 0
    let supplierUpdate = 0
    let supplierFailed = 0
    let total = 0

    // 将当前Sheet的数据转换为JSON
    const json = await Aide.excelToJson(buffer, mapper)
    const trendsFieldDatas = await TrendsTemplate.findOne({
      where: { code: 'supplier' },
      include: [
        {
          association: 'trendsFieldDatas',
          attributes: ['id', 'name', 'types', 'state', 'len', 'sort', 'tip', 'fieldOption'],
          order: ['sort'],
        },
      ],
    })
    // 遍历每行数据并保存到数据库
    for (let rowElement of json.row) {
      let temp
      if (rowElement.shortName && rowElement.fullName) {
        if (trendsFieldDatas) {
          let trendsDatas = JSON.stringify(trendsFieldDatas.trendsFieldDatas)
          let formData = await Aide.excelAddFormData(trendsDatas, rowElement.formData)
          rowElement.formData = formData
        }
        temp = await Supplier.findOne({ where: { shortName: rowElement.shortName } })
        if (temp) {
          await Supplier.update({ ...rowElement }, { where: { id: temp.id } })
          supplierUpdate++
        } else if (rowElement.fullName) {
          temp = await Supplier.findOne({ where: { shortName: rowElement.fullName } })
          if (!temp) {
            await Supplier.create(rowElement)
            supplierSuccess++
          }
        }
      } else {
        supplierFailed++
      }
      total++
    }
    result = { total, success: supplierSuccess, update: supplierUpdate, failed: supplierFailed }
    return result
  }

  public async batDelete(dto: deleteIdsDto, loadModel) {
    let success = 0
    let failed = 0
    let errors: Array<string> = []
    for (const id of dto.ids) {
      try {
        const deleteNum = await Supplier.destroy({ where: { id } })
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
