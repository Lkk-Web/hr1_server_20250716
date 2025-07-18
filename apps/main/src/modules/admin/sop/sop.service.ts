import { Pagination } from '@common/interface'
import { HttpException, Injectable } from '@nestjs/common'
import { CSOPDto, FindPaginationDto, USOPDto } from './sop.dto'
import { SOP } from '@model/process/SOP.model'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { FileList } from '@model/document/FileList.model'
import { Process } from '@model/process/process.model'
import { SOPMaterial } from '@model/process/SOPMaterial.model'
import { SOPFile } from '@model/process/SOPFile.model'

@Injectable()
export class SopService {
  constructor() {}

  public async create(dto: CSOPDto, user) {
    if (dto.fileListIds) {
      for (const fileListId of dto.fileListIds) {
        const file = await FileList.findByPk(fileListId)
        if (!file) throw new HttpException('所选SOP文件不存在', 400)
      }
    }
    const process = await Process.findByPk(dto.processId)
    if (!process) throw new HttpException('所选工序不存在', 400)
    let code
    //按规则创建编码
    const date = new Date()
    const year = date.getFullYear().toString().substring(2)
    const month = date.getMonth().toString().padStart(2, '0')
    const temp = await SOP.findOne({
      order: [['createdAt', 'DESC']],
      where: { code: { [Op.like]: `SOP${year}${month}%` } },
    })
    if (temp) {
      const oldNO = temp.code
      const lastFourChars = oldNO.length >= 4 ? oldNO.slice(-4) : '0'.repeat(4 - oldNO.length) + oldNO
      let num = parseInt(lastFourChars)
      num++
      let newNO = num.toString().padStart(4, '0')

      code = 'SOP' + year + month + newNO
    } else {
      code = 'SOP' + year + month + '0001'
    }

    const result = await SOP.create({ ...dto, code, createdUserId: user.id, updatedUserId: user.id })
    if (dto.ids) {
      for (const id of dto.ids) {
        // const same = await SOPMaterial.findOne({ where: { materialId: id } })
        // if (same) {
        // 	const mat = await Material.findByPk(id)
        // 	throw new HttpException('所选物料' + mat.code + '-' + mat.name + '已存在其他作业指导书中', 400)
        // }
        await SOPMaterial.create({ sopId: result.id, materialId: id })
      }
    }
    if (dto.fileListIds) {
      for (const fileListId of dto.fileListIds) {
        await SOPFile.create({ sopId: result.id, fileListId })
      }
    }
    return result
  }

  public async edit(dto: USOPDto, id: number, user) {
    // 检查 DTO 是否只有 `status` 属性
    const dtoKeys = Object.keys(dto).filter(key => dto[key] !== undefined)
    const isStatusOnlyUpdate = dtoKeys.length === 1 && dtoKeys.includes('status')

    // 查找目标 SOP 数据
    let sop = await SOP.findOne({ where: { id } })
    if (!sop) {
      throw new HttpException('数据不存在', 400006)
    }

    // 如果是仅更新 `status`
    if (isStatusOnlyUpdate) {
      await sop.update({ status: dto.status, updatedUserId: user.id })
    } else {
      // 更新其他字段
      await SOPMaterial.destroy({ where: { sopId: id } })
      await SOPFile.destroy({ where: { sopId: id } })
      await sop.update({ ...dto, updatedUserId: user.id })

      // 处理关联的物料 ID
      if (dto.ids) {
        /*for (const materialId of dto.ids) {
					const same = await SOPMaterial.findOne({ where: { materialId } });
					if (same) {
						const mat = await Material.findByPk(materialId);
						throw new HttpException(
							'所选物料' + mat.code + '-' + mat.name + '已存在其他作业指导书中',
							400,
						);
					}
					await SOPMaterial.create({ sopId: id, materialId });
				}*/
        await SOPMaterial.bulkCreate(dto.ids.map(materialId => ({ sopId: id, materialId })))
      }
      if (dto.fileListIds) {
        await SOPFile.bulkCreate(dto.fileListIds.map(fileListId => ({ sopId: id, fileListId })))
      }
    }

    // 重新查询并返回更新后的数据
    sop = await SOP.findOne({ where: { id } })
    return sop
  }

  public async delete(id: number) {
    await SOPMaterial.destroy({ where: { sopId: id } })
    await SOPFile.destroy({ where: { sopId: id } })
    const result = await SOP.destroy({
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
          association: 'fileList',
          attributes: ['id', 'name', 'url'],
          where: {},
          through: { attributes: [] },
        },
        {
          association: 'process',
          attributes: ['id', 'processName'],
        },
        {
          association: 'materials',
          attributes: ['id', 'name', 'code', 'spec'],
          through: { attributes: [] },
        },
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
      ],
    }
    const result = await SOP.findOne(options)
    return result
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
      include: [
        {
          association: 'process',
          attributes: ['id', 'processName'],
        },
        {
          association: 'materials',
          attributes: ['id', 'name', 'code', 'spec'],
          through: { attributes: [] },
        },
        {
          association: 'fileList',
          attributes: ['id', 'name', 'url'],
          through: { attributes: [] },
        },
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
      ],
    }
    if (dto.text) {
      options.where[Op.or] = [{ code: { [Op.like]: `%${dto.text}%` } }]
    }
    const result = await SOP.findPagination<SOP>(options)
    return result
  }
}
