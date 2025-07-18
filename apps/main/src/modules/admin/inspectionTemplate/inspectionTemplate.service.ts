import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import { CInspectionTemplateDTO, FindPaginationDto, UInspectionTemplateDTO, InspectionTemplateTypeEnum } from './inspectionTemplate.dto'
import { InspectionTemplate } from '@model/qm/inspectionTemplate.model'
import { Sequelize } from 'sequelize-typescript'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { Paging } from '@library/utils/paging'
// import { InspectionTemplateItem } from '@model/qm/inspectionTemplateItem.model'
import { InspectionTemplateMat } from '@model/qm/inspectionTemplateMat.model'
import { deleteIdsDto } from '@common/dto'
import { InspectionTemplateItem } from '@model/qm/inspectionTemplateItem.model'

@Injectable()
export class InspectionTemplateService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: Redis,
    @InjectModel(InspectionTemplate)
    private inspectionTemplateModel: typeof InspectionTemplate,
    private sequelize: Sequelize,
  ) {
  }

  public async create(dto: CInspectionTemplateDTO, user) {
    const same = await InspectionTemplate.findOne({ where: { name: dto.name },attributes:['id'] })
    if (same) throw new HttpException('已有相同名称的检验模板', 400)
    
    // 检查同类型下是否已存在通用方案
    if (dto.templateType === InspectionTemplateTypeEnum.GENERAL) {
      const existingGeneral = await InspectionTemplate.findOne({ 
        where: { 
          type: dto.type, 
          templateType: InspectionTemplateTypeEnum.GENERAL 
        },
        attributes: ['id']
      })
      if (existingGeneral) {
        throw new HttpException(`检验种类「${dto.type}」已存在通用方案，同类型只能有一个通用方案`, 400)
      }
    }
    const date = new Date()
    const year = date.getFullYear().toString().substring(2)
    const month = date.getMonth().toString().padStart(2, '0')
    const temp = await InspectionTemplate.findOne({
      order: [['createdAt', 'DESC']],
      where: { code: { [Op.like]: `QCT${year}${month}%` } },
      attributes:['code']
    })
    if (temp) {
      const oldNO = temp.code
      const lastFourChars = oldNO.length >= 4 ? oldNO.slice(-4) : '0'.repeat(4 - oldNO.length) + oldNO
      let num = parseInt(lastFourChars)
      num++
      let newNO = num.toString().padStart(4, '0')

      dto['code'] = 'QCT' + year + month + newNO
    } else {
      dto['code'] = 'QCT' + year + month + '0001'
    }
    const result = await InspectionTemplate.create({
      ...dto,
      createdUserId: user?.id,
      updatedUserId: user?.id,
    })
    if (dto.items) {
      for (const item of dto.items) {
        await InspectionTemplateItem.create({
          inspectionTemplateId: result.id,
          name: item.name,
          data: item.data,
        })
      }
    }
    // 只有物料类型才处理materialIds
    if (dto.templateType === InspectionTemplateTypeEnum.MATERIAL && dto.materialIds) {
      for (const materialId of dto.materialIds) {
        await InspectionTemplateMat.create({
          inspectionTemplateId: result.id,
          materialId: materialId,
        })
      }
    }
    return result
  }


  public async edit(dto: UInspectionTemplateDTO, id: number) {
    let inspectionTemplate = await InspectionTemplate.findOne({ where: { id } })
    if (!inspectionTemplate) {
      throw new HttpException('数据不存在', 400006)
    }
    const same = await InspectionTemplate.findOne({ where: { name: dto.name, id: { [Op.ne]: id } } })
    if (same) throw new HttpException('已有相同名称的检验模板', 400)
    
    // 检查同类型下是否已存在通用方案（排除当前记录）
    if (dto.templateType === InspectionTemplateTypeEnum.GENERAL) {
      const existingGeneral = await InspectionTemplate.findOne({ 
        where: { 
          type: dto.type, 
          templateType: InspectionTemplateTypeEnum.GENERAL,
          id: { [Op.ne]: id }
        },
        attributes: ['id']
      })
      if (existingGeneral) {
        throw new HttpException(`检验种类「${dto.type}」已存在通用方案，同类型只能有一个通用方案`, 400)
      }
    }
    await InspectionTemplateItem.destroy({ where: { inspectionTemplateId: id } })
    await InspectionTemplateMat.destroy({ where: { inspectionTemplateId: id } })
    await inspectionTemplate.update(dto)
    if (dto.items) {
      for (const item of dto.items) {
        await InspectionTemplateItem.create({
          inspectionTemplateId: id,
          name: item.name,
          data: item.data,
        })
      }
    }
    // 只有物料类型才处理materialIds
    if (dto.templateType === InspectionTemplateTypeEnum.MATERIAL && dto.materialIds) {
      for (const materialId of dto.materialIds) {
        await InspectionTemplateMat.create({
          inspectionTemplateId: id,
          materialId: materialId,
        })
      }
    }
    inspectionTemplate = await InspectionTemplate.findOne({ where: { id } })
    return inspectionTemplate
  }

  public async delete(id: number) {
    await InspectionTemplateItem.destroy({ where: { inspectionTemplateId: id } })
    await InspectionTemplateMat.destroy({ where: { inspectionTemplateId: id } })
    const result = await InspectionTemplate.destroy({
      where: {
        id: id,
      },
    })
    return result
  }

  public async find(id: number) {
    const options: FindOptions = {
      where: { id },
      include: [
        {
          association: 'createdUser',
          attributes: ['id', 'userName'],
          required: false,
        },
        {
          association: 'updatedUser',
          attributes: ['id', 'userName'],
          required: false,
        },
        {
          association: 'items',
          attributes: ['id', 'name', 'data']
        },
        {
          association: 'materials',
          attributes: ['id', 'name', 'code', 'spec'],
          through: { attributes: [] },
        },
      ],
    }
    const result = await InspectionTemplate.findOne(options)
    return result
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
      include: [
        {
          association: 'createdUser',
          attributes: ['id', 'userName'],
          required: false,
        },
        {
          association: 'updatedUser',
          attributes: ['id', 'userName'],
          required: false,
        },
        {
          association: 'materials',
          attributes: ['id', 'name', 'code', 'spec'],
          through: { attributes: [] },
        },
      ],
      attributes:{exclude:['data']}
    }

    if (dto.code) {
      options.where['code'] = {
        [Op.like]: `%${dto.code}%`,
      }
    }

    if (dto.name) {
      options.where['name'] = {
        [Op.like]: `%${dto.name}%`,
      }
    }

    if (dto.type) {
      options.where['type'] = {
        [Op.like]: `%${dto.type}%`,
      }
    }

    if (dto.templateType) {
      options.where['templateType'] = {
        [Op.eq]: dto.templateType,
      }
    }
    
    const result = await Paging.diyPaging(InspectionTemplate, pagination, options)
    return result
  }

  public async batDelete(dto: deleteIdsDto) {
    for (const id of dto.ids) {
      await this.delete(id)
    }
  }
}
