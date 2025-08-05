import { Pagination } from '@common/interface'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Injectable } from '@nestjs/common'
import { User } from '@model/auth/user'
import { CUserDto, FindPaginationDto, SUserDto, UUserDto } from './user.dto'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { Aide, JsExclKey } from '@library/utils/aide'
import { Organize } from '@model/auth/organize'
import { trim } from 'lodash'
import { Role } from '@model/auth/role'
import { Paging } from '@library/utils/paging'
import { CryptoUtil } from '@library/utils/crypt.util'
import { KingdeeeService } from '@library/kingdee'
import { ApiDict } from '@model/system/apiDict.model'
import _ = require('lodash')

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User
  ) {}

  public async create(dto: CUserDto, loadModel) {
    let temp
    if (dto.userCode) {
      let temp = await User.findOne({ where: { userCode: dto.userCode } })
      if (temp) {
        throw new HttpException('该工号的员工已存在', 400)
      }
    }
    temp = await User.findOne({ where: { phone: dto.phone } })
    if (temp) {
      throw new HttpException('该手机号的员工已存在', 400)
    }
    if (dto.email) {
      temp = await User.findOne({ where: { email: dto.email } })
      if (temp) {
        throw new HttpException('该邮箱的员工已存在', 400)
      }
    }
    temp = await User.findOne({ order: [['id', 'DESC']], where: { userCode: { [Op.like]: `ST%` } } })
    if (temp) {
      let num = parseInt(temp.userCode.substring(4))
      num++
      const oldNO = temp.userCode
      const lastFourChars = oldNO.length >= 4 ? oldNO.slice(-4) : '0'.repeat(4 - oldNO.length) + oldNO
      let newNO = lastFourChars.padStart(4, '0')
      newNO = (parseInt(newNO, 10) + 1).toString().padStart(4, '0')
      dto['userCode'] = 'ST' + new Date().getFullYear().toString().substring(2) + newNO
    } else {
      dto['userCode'] = 'ST' + new Date().getFullYear().toString().substring(2) + '0001'
    }
    const result = await User.create(dto)
    return result
  }

  public async edit(dto: UUserDto, id: number, loadModel) {
    let user = await User.findOne({ where: { id }, attributes: ['id', 'userCode', 'phone', 'email'] })
    if (!user) {
      throw new HttpException('数据不存在', 400006)
    }
    let temp
    if (dto.userCode && dto.userCode != user.userCode) {
      temp = await User.findOne({ where: { userCode: dto.userCode } })
      if (temp && temp.id != id) {
        throw new HttpException('该工号的员工已存在', 400)
      }
    }
    if (dto.phone && dto.phone != user.phone) {
      temp = await User.findOne({ where: { phone: dto.phone }, attributes: ['id'] })
      if (temp && temp.id != id) {
        throw new HttpException('该手机号的员工已存在', 400)
      }
    }

    if (dto.email && dto.email != user.email) {
      temp = await User.findOne({ where: { email: dto.email }, attributes: ['id'] })
      if (temp && temp.id != id) {
        throw new HttpException('该邮箱的员工已存在', 400)
      }
    }
    await user.update(dto)
    return user
  }

  public async syncUser(dto: SUserDto, loadModel) {
    // console.log(dto.phone)
    // let user = await User.findOne({ where: { phone: dto.phone } })
    // if (!user) {
    //   throw new HttpException('数据不存在', 400006)
    // }
    // user = await User.findOne({ where: { phone: dto.phone, openId: dto.openId } })
    // if (!user) {
    //   await User.update({ openId: dto.openId }, { where: { phone: dto.phone } })
    // }
    return true
  }

  public async delete(id: number, loadModel) {
    const result = await User.destroy({
      where: {
        id: id,
      },
    })
    return result
  }

  public async find(id: number, loadModel) {
    const options: FindOptions = {
      where: { id },
      attributes: ['id', 'userCode', 'code', 'phone', 'userName', 'createdAt', 'station', 'updatedAt', 'email', 'departmentId', 'state', 'roleId', 'status', 'remark'],
      include: [
        {
          association: 'department',
          attributes: ['id', 'name'],
        },
        {
          association: 'role',
          attributes: ['id', 'name'],
        },
      ],
    }
    const result = await User.findOne(options)
    return result
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, loadModel) {
    const options: FindPaginationOptions = {
      where: {},
      attributes: ['id', 'userCode', 'code', 'phone', 'userName', 'createdAt', 'station', 'updatedAt', 'email', 'departmentId', 'state', 'roleId', 'status', 'remark'],
      pagination,
      include: [
        {
          association: 'department',
          attributes: ['id', 'name'],
        },
        {
          association: 'role',
          attributes: ['id', 'name'],
        },
      ],
    }
    if (dto.default) {
      options.where['userCode'] = {
        [Op.like]: `%${dto.default}%`,
      }

      options.where['userName'] = {
        [Op.like]: `%${dto.default}%`,
      }
    }
    if (dto.status) {
      const statusString = String(dto.status).toLowerCase().trim() // 确保字符串统一处理
      const statusBoolean = statusString === 'true' || statusString === '1' // 转换逻辑
      options.where['status'] = {
        [Op.eq]: statusBoolean,
      }
    }
    if (dto.userName) {
      options.where['userName'] = {
        [Op.like]: `%${dto.userName}%`,
      }
    }
    if (dto.userCode) {
      options.where['userCode'] = {
        [Op.like]: `%${dto.userCode}%`,
      }
    }
    if (dto.departmentId) {
      options.where['departmentId'] = {
        [Op.eq]: dto.departmentId,
      }
    }
    if (dto.email) {
      options.where['email'] = {
        [Op.like]: `%${dto.email}%`,
      }
    }
    if (dto.phone) {
      options.where['phone'] = {
        [Op.like]: `%${dto.phone}%`,
      }
    }
    if (dto.roleId) {
      options.where['roleId'] = {
        [Op.eq]: dto.roleId,
      }
    }

    const result = await Paging.diyPaging(User, pagination, options)
    return result
  }

  public async importExcel(buffer: Buffer, loadModel) {
    const mapper: JsExclKey[] = [
      {
        keyName: '工号', // Excel列的名称
        key: 'userCode', // 物料Model类中的属性名
      },
      {
        keyName: '员工姓名',
        key: 'userName',
      },
      {
        keyName: '手机号',
        key: 'phone',
      },
      {
        keyName: '邮箱',
        key: 'email',
      },
      {
        keyName: '部门名称',
        key: 'departmentName',
      },
      {
        keyName: '角色',
        key: 'roleName',
      },
    ]
    let result = {}
    let userSuccess = 0
    let userUpdate = 0
    let userFailed = 0
    let total = 0
    let errors: Array<string> = []

    // 将当前Sheet的数据转换为JSON
    const json = await Aide.excelToJson(buffer, mapper)
    // 遍历每行数据并保存到数据库
    for (const rowElement of json.row) {
      if (rowElement.departmentName) {
        const nameArray = rowElement.departmentName.split('\\')
        const dept = await Organize.findOne({ where: { name: trim(nameArray[nameArray.length - 1]) } })
        const role = await Role.findOne({ where: { name: trim(rowElement.roleName) } })
        const options = {}
        const same = await User.findOne({
          where: {
            [Op.or]: [{ userName: { [Op.eq]: rowElement.userName } }, { phone: { [Op.eq]: rowElement.phone } }, { email: { [Op.eq]: rowElement.email ? rowElement.email : '1' } }],
          },
        })
        if (dept && role && !same) {
          await User.create({ ...rowElement, departmentId: dept.id, roleId: role.id, status: 1 })
          userSuccess++
        } else {
          userFailed++
        }
      }
      total++
    }
    result = { total, success: userSuccess, update: userUpdate, failed: userFailed }
    return result
  }

  public async resetPassword(id: number, user) {
    // @ts-ignore
    let temp = await User.findOne({ where: { id } })
    if (!temp) {
      throw new HttpException('该用户不存在', 400)
    }

    await User.update({ password: CryptoUtil.sm4Encryption('123456') }, { where: { id } })
    const res = await User.findOne({ where: { id } })
    return res
  }

  public async asyncKingdee() {
    // let filterString = await KingdeeeService.buildFilterString([
    //   { key: "FUseOrgId.FNumber", type: "string", value: '102' }
    // ])
    let filterString = `FUseOrgId='${process.env.K3_ORG_ID}'`
    let data = await KingdeeeService.getList('BD_Empinfo', 'FID,FNumber,FName,FBaseProperty,FForbidStatus,FMobile,FBaseProperty3', filterString)
    let mate = []
    let orgList = await ApiDict.findAll({ where: { name: '岗位信息', xtName: '金蝶' }, attributes: ['fid', 'code', 'content', 'content1', 'content2'] })
    const password = CryptoUtil.sm4Encryption('123456')
    for (const item of data) {
      let userOrg = ''
      for (const org of orgList) {
        if (org.content == item.FBaseProperty && org.content2 == item.FBaseProperty3) {
          userOrg = org.content1
          break
        }
      }
      if (userOrg != '') {
        let temp = {
          id: item.FID,
          userCode: item.FNumber,
          userName: item.FName,
          phone: item.FMobile?.trim() || null,
          password,
          departmentId: userOrg,
          status: item.FForbidStatus == 'A' ? true : false,
          roleId: 4,
        }

        mate.push(temp)
      }
    }
    // return 11
    //查询对应id的部门是否存在
    const orgIds = _.uniq(mate.map(v => Number(v.departmentId)))
    const orgs = await Organize.findAll({ where: { id: orgIds }, attributes: ['id'] })
    //不存在就创建
    const createIds = _.difference(
      orgIds,
      orgs.map(v => v.id)
    )
    if (createIds.length > 0) {
      // console.log('创建部门', createIds)
      // @ts-ignore
      await Organize.bulkCreate(
        (createIds as any).map((v: string) => {
          const temp = orgList.find(vv => vv.content1 == v)
          return {
            id: v,
            name: temp?.content2,
            shortName: temp?.content2,
            code: temp?.code,
            status: true,
          }
        })
      )
    }
    for (let i = 0; i < mate.length; i += 100) {
      const batch = mate.slice(i, i + 100)
      await User.bulkCreate(batch, { updateOnDuplicate: ['id', 'userCode', 'userName', 'status', 'departmentId'] })
    }
    return true
  }
}
