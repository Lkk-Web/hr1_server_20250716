import { Pagination } from '@common/interface'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Injectable } from '@nestjs/common'
import { DefectiveItem } from '@model/qm/defectiveItem.model'
import { CDefectiveItemDto, FindPaginationDto, UDefectiveItemDto } from './defectiveItem.dto'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { Aide, JsExclKey } from '@library/utils/aide'
import { deleteIdsDto } from '@common/dto'
import { AdjustOrder, TrendsTemplate } from '@model/index'
import { trim } from 'lodash'
import { Paging } from '@library/utils/paging'

@Injectable()
export class DefectiveItemService {
  constructor(
    @InjectModel(DefectiveItem)
    private defectiveItemModel: typeof DefectiveItem
  ) { }

  public async create(dto: CDefectiveItemDto, loadModel) {
    const temp = await DefectiveItem.findOne({ where: { name: dto.name } })
    if (temp) {
      throw new HttpException('同名称不良品项已存在!', 400)
    }
    const result = await DefectiveItem.create(dto)
    return result
  }

  public async edit(dto: UDefectiveItemDto, id: number, loadModel) {
    let defectiveItem = await DefectiveItem.findOne({ where: { id } })
    if (!defectiveItem) {
      throw new HttpException('数据不存在', 400006)
    }
    const temp = await DefectiveItem.findOne({ where: { name: dto.name } })
    if (temp && temp.id != id) {
      throw new HttpException('同名称不良品项已存在!', 400)
    }
    await defectiveItem.update(dto)
    defectiveItem = await DefectiveItem.findOne({ where: { id } })
    return defectiveItem
  }

  public async delete(id: number, loadModel) {
    const result = await DefectiveItem.destroy({
      where: {
        id: id,
      },
    })
    return result
  }

  public async find(id: number, loadModel) {
    const options: FindOptions = { where: { id }, include: [{ all: true }] }
    const result = await DefectiveItem.findOne(options)
    return result
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, loadModel) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
    }
    if (dto.default) {
      options.where['name'] = {
        [Op.like]: `%${dto.default}%`,
      }
      options.where['code'] = {
        [Op.like]: `%${dto.default}%`,
      }
    }
    if (dto.name) {
      options.where['name'] = {
        [Op.like]: `%${dto.name}%`,
      }
    }
    // if (dto.category) {
    //   options.where['category'] = {
    //     [Op.like]: `%${dto.category}%`,
    //   }
    // }
    if (dto.code) {
      options.where['code'] = {
        [Op.like]: `%${dto.code}%`,
      }
    }
    const result = await Paging.diyPaging(DefectiveItem, pagination, options);
    return result
  }

  public async importExcel(buffer: Buffer, loadModel) {
    const mapper: JsExclKey[] = [
      {
        keyName: '编码', // Excel列的名称
        key: 'code', // DefectItem类中的属性名
      },
      // {
      //   keyName: '不良品项分类', // Excel列的名称
      //   key: 'category',  // DefectItem类中的属性名
      // },
      {
        keyName: '不良品项名称', // Excel列的名称
        key: 'name', // DefectItem类中的属性名，标记为必填
      },
      {
        keyName: '动态字段集合', // Excel列的名称
        key: 'formData', // Supplier类中的属性名
      },
    ]
    let result = {}
    let defectiveItemSuccess = 0
    let defectiveItemUpdate = 0
    let defectiveItemFailed = 0
    let total = 0

    // 将当前Sheet的数据转换为JSON
    const json = await Aide.excelToJson(buffer, mapper)
    const trendsFieldDatas = await TrendsTemplate.findOne({
      where: { code: 'defectiveItem' },
      include: [
        {
          association: 'trendsFieldDatas',
          attributes: ['id', 'name', 'types', 'state', 'len', 'sort', 'tip', 'fieldOption'],
          order: ['sort'],
        },
      ],
    })
    // 遍历每行数据并保存到数据库
    for (const rowElement of json.row) {
      if (rowElement.name) {
        if (trendsFieldDatas) {
          let trendsDatas = JSON.stringify(trendsFieldDatas.trendsFieldDatas)
          let formData = await Aide.excelAddFormData(trendsDatas, rowElement.formData)
          rowElement.formData = formData
        }
        const temp = await DefectiveItem.findOne({
          where: {
            name: trim(rowElement.name),
            // category: trim(rowElement.category),
          },
        })
        if (temp) {
          await DefectiveItem.update({ ...rowElement }, { where: { id: temp.id } })
          defectiveItemUpdate++
        } else {
          await DefectiveItem.create(rowElement)
          defectiveItemSuccess++
        }
      } else {
        defectiveItemFailed++
      }
      total++
    }
    result = { total, success: defectiveItemSuccess, update: defectiveItemUpdate, failed: defectiveItemFailed }
    return result
  }

  public async batDelete(dto: deleteIdsDto, loadModel) {
    let success = 0
    let failed = 0
    let errors: Array<string> = []
    for (const id of dto.ids) {
      try {
        const deleteNum = await DefectiveItem.destroy({ where: { id } })
        if (deleteNum) {
          success++
        } else {
          failed++
        }
      } catch (e) {
        errors.push(`删除不良品项 ID ${id} 时出错: ${e.message}`)
        failed++
      }
    }
    return { success, failed }
  }
}
