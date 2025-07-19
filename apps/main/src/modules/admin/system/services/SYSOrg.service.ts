import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import _ = require('lodash')
import { Organize } from '@model/auth/organize'
import { CSYSOrgDto, ESYSOrgDto, FindAllDto } from '../dtos/SYSOrg.dto'
import { User } from '@model/auth/user.model'
import { STRUtil } from '@library/utils/str'
import { SystemBusinessLog } from '@model/system/SYSBusinessLog.model'
import { SYS_MODULE, USER_TYPE } from '@common/constant'
import { FindOptions, Op } from 'sequelize'
import { Aide, JsExclKey } from '@library/utils/aide'
import { trim } from 'lodash'
import { Role } from '@model/auth/role'

@Injectable()
export class SYSOrgService {
  constructor(
    @InjectModel(Organize)
    private SYSOrgModel: typeof Organize
  ) {}

  public async create(dto: CSYSOrgDto, user: User, loadModel) {
    // if (user.type != USER_TYPE.GLOBAL_ADMIN) {
    // 	// 无权操作
    // 	throw new HttpException('无权操作', 400);
    // }
    let sysOrg = await Organize.findOne({ where: { name: dto.name } })
    if (sysOrg) {
      throw new HttpException('该组织/部门已存在', 400)
    }
    // const code = await this.createOrgCode(dto.shortName);
    // 生成机构编码
    const result = await Organize.create({
      ...dto,
      // code: code,
    })
    if (dto.users) {
      for (const user1 of dto.users) {
        const temp = await User.findByPk(user1)
        if (!temp) {
          throw new HttpException('ID为' + temp.id + '的员工不存在!', 400)
        }
      }
    }
    // await SYSBusinessLog.create({
    // 	description: '创建组织',
    // 	params: `${dto.name}`,
    // 	userId: user.id,
    // 	module: SYS_MODULE.ORG,
    // });
    return this.find(result.id, loadModel)
  }

  public async edit(dto: ESYSOrgDto, id: number, user: User, loadModel) {
    let sysOrg = await Organize.findOne({ where: { id } })
    if (!sysOrg) {
      throw new HttpException('数据不存在', 400)
    }
    if (dto.name) {
      const temp = await Organize.findOne({ where: { name: dto.name } })
      if (temp && temp.id != id) {
        throw new HttpException('该组织/部门已存在', 400)
      }
    }
    await sysOrg.update(dto)
    sysOrg = await Organize.findOne({ where: { id } })
    if (dto.users) {
      // await UserDepartment.destroy({ where: { deptId: id } })
      for (const user1 of dto.users) {
        const temp = await User.findByPk(user1)
        if (!temp) {
          throw new HttpException('ID为' + temp.id + '的员工不存在!', 400)
        }
        // await UserDepartment.create({ userId: user1, deptId: id })
      }
    }
    // await SYSBusinessLog.create({
    // 	description: '修改组织',
    // 	params: `${id}`,
    // 	userId: user.id,
    // 	module: SYS_MODULE.ORG,
    // });
    return this.find(id, loadModel)
  }

  public async delete(id: number, user: User, loadModel) {
    const result = await Organize.destroy({
      where: {
        id: id,
      },
    })
    // await SYSBusinessLog.create({
    // 	description: '删除组织',
    // 	params: `${id}`,
    // 	userId: user.id,
    // 	module: SYS_MODULE.ORG,
    // });
    return result
  }

  public async find(id: number, loadModel) {
    const options: FindOptions = {
      where: { id },
      attributes: ['id', 'name', 'code', 'attr', 'shortName', 'coordinate', 'createdAt', 'address', 'updatedAt', 'parentId', 'status', 'types', 'sort', 'remark'],
      // include: [
      // 	{
      // 		association: 'deptUsers',
      // 		include: [
      // 			{
      // 				association: 'user',
      // 				attributes: ['id', 'userName'],
      // 			},
      //
      // 		],
      // 	},
      // ]
    }
    const result = await Organize.findOne(options)
    return result
  }

  public async findAll(dto: FindAllDto, loadModel) {
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
      // include: [
      // 	{
      // 		association: 'deptUsers',
      // 		include: [
      // 			{
      // 				association: 'user',
      // 				attributes: ['id', 'userName'],
      // 			},
      //
      // 		],
      // 	},
      // ]
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
    const orgs = await Organize.findAll(options)
    for (const org of orgs) {
      org.setDataValue('count', org.dataValues.userArray.length)
    }

    let endOrgs = JSON.parse(JSON.stringify(orgs))
    let result = STRUtil.buildMenuTree(endOrgs)
    return { data: result, message: 'success', code: 200 }
  }

  // 上移部门
  public async moveUp(deptId: number, loadModel) {
    const dept = await Organize.findByPk(deptId)

    if (!dept) throw new Error('部门不存在')

    const upperDept = await Organize.findOne({
      where: {
        parentId: dept.parentId,
        sort: { [Op.lt]: dept.sort }, // 找到下一个部门
      },
      order: [['sort', 'DESC']],
    })

    if (upperDept) {
      // 交换 sortOrder
      const temp = dept.sort
      dept.sort = upperDept.sort
      upperDept.sort = temp

      await dept.save()
      await upperDept.save()
    }
    return 'success'
  }

  // 下移部门
  public async moveDown(deptId: number, loadModel) {
    const dept = await Organize.findByPk(deptId)

    if (!dept) throw new Error('部门不存在')

    const lowerDept = await Organize.findOne({
      where: {
        parentId: dept.parentId,
        sort: { [Op.gt]: dept.sort }, // 找到下一个部门
      },
      order: [['sort', 'ASC']],
    })

    if (lowerDept) {
      // 交换 sortOrder
      const temp = dept.sort
      dept.sort = lowerDept.sort
      lowerDept.sort = temp

      await dept.save()
      await lowerDept.save()
    }
    return 'success'
  }

  // 生成机构编码
  // public async createOrgCode(shortName: string) {
  // 	let code = STRUtil.convertToPinyinInitials(shortName);
  // 	const count = await SYSOrg.count({ where: { code } });
  // 	if (count != 0) {
  // 		code = code + count;
  // 	}
  // 	return code;
  // }

  public async importExcel(buffer: Buffer, loadModel) {
    const mapper: JsExclKey[] = [
      {
        keyName: '部门名称', // Excel列的名称
        key: 'departmentName', // 物料Model类中的属性名
      },
      {
        keyName: '上级部门',
        key: 'parentDepartmentName',
      },
      {
        keyName: '备注',
        key: 'remark',
      },
    ]
    let result = {}
    let deptSuccess = 0
    let deptUpdate = 0
    let deptFailed = 0
    let total = 0
    let errors: Array<string> = []

    // 将当前Sheet的数据转换为JSON
    const json = await Aide.excelToJson(buffer, mapper)
    // 遍历每行数据并保存到数据库
    for (const rowElement of json.row) {
      if (rowElement.departmentName) {
        const parentDept = await Organize.findOne({ where: { name: trim(rowElement.parentDepartmentName) } })
        let same
        if (parentDept) {
          same = await Organize.findOne({ where: { name: trim(rowElement.departmentName), parentId: parentDept.id } })
        } else {
          same = await Organize.findOne({ where: { name: trim(rowElement.departmentName) } })
        }
        if (!same && parentDept) {
          const temp = await Organize.findOne({ where: { id: parentDept.id }, order: [['sort', 'DESC']] })
          await Organize.create({ name: trim(rowElement.departmentName), parentId: parentDept.id, status: 1, remark: rowElement.remark, sort: temp.sort + 1 })
          deptSuccess++
        } else if (!same) {
          const temp = await Organize.findOne({ where: { parentId: null }, order: [['sort', 'DESC']] })
          await Organize.create({ name: trim(rowElement.departmentName), status: 1, remark: rowElement.remark, sort: temp.sort + 1 })
          deptSuccess++
        } else {
          deptFailed++
        }
      }
      total++
    }
    result = { total, success: deptSuccess, update: deptUpdate, failed: deptFailed }
    return result
  }
}
