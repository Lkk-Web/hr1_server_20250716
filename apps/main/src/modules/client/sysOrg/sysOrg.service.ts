import { FindAllDto } from '@modules/admin/system/dtos/SYSOrg.dto'
import { Injectable } from '@nestjs/common'
import { Op } from 'sequelize'
import { SYSOrg } from '@model/index'
import { STRUtil } from '@library/utils/str'

@Injectable()
export class SysOrgService {
  public async findAll(dto: FindAllDto) {
    const options = {
      where: {},
      attributes: ['id', 'name', 'code', 'attr', 'shortName', 'coordinate', 'createdAt', 'address', 'updatedAt', 'parentId', 'status', 'types', 'sort', 'remark'],
      include: [
        {
          association: 'userArray',
          attributes: ['id', 'userName', 'departmentId'],
          where: {},
          required: false,
        },
      ],
    }
    if (dto.name) {
      options.where['name'] = {
        [Op.like]: `%${dto.name}%`,
      }
    }
    // if (dto.shortName) {
    // 	options.where['shortName'] = {
    // 		[Op.like]: `%${dto.shortName}%`,
    // 	};
    // }
    if (dto.address) {
      options.where['address'] = {
        [Op.eq]: dto.address,
      }
    }
    if (dto.status) {
      const statusString = String(dto.status).toLowerCase().trim() // 确保字符串统一处理
      const statusBoolean = statusString === 'true' || statusString === '1' // 转换逻辑
      options.where['status'] = {
        [Op.eq]: statusBoolean,
      }
    }
    const orgs = await SYSOrg.findAll(options)
    for (const org of orgs) {
      org.setDataValue('count', org.dataValues.userArray.length)
    }

    let endOrgs = JSON.parse(JSON.stringify(orgs))
    let result = STRUtil.buildMenuTree(endOrgs)
    return { data: result, message: 'success', code: 200 }
  }
}
