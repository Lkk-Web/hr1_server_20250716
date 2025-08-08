import { Pagination } from '@common/interface'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Injectable } from '@nestjs/common'
import { Role } from '@model/auth/role'
import { RoleMenu } from '@model/auth/roleMenu'
import { FindOptions, Op, Sequelize, where } from 'sequelize'
import { Menu } from '@model/auth/menu'
import { FindPaginationOptions } from '@model/shared/interface'
import { Aide, JsExclKey } from '@library/utils/aide'
import { trim } from 'lodash'
import { Paging } from '@library/utils/paging'
import { FindPaginationDto, RoleCreateDto, RoleEditDto, RoleMenuPowerDto } from './role.dto'
import { User } from '@model/index'
import { RoleOrganize } from '@model/auth/roleOrganize'
import { DATA_SCOPE_TYPE } from '@common/constant'

@Injectable()
export class RoleService {
  constructor(
    @InjectModel(Role)
    private roleModal: typeof Role
  ) {}

  public async create(dto: RoleCreateDto, user: User, ip: string, loadModel) {
    const transaction = await Role.sequelize.transaction()
    try {
      let sysRole = await this.roleModal.findOne({ where: { name: dto.name }, transaction })
      if (sysRole) {
        throw new HttpException('该角色已存在', 400)
      }

      let orgList = []
      if (dto.dataScopeType == '4') {
        orgList = dto.orgs
      }

      const res = await Role.create(dto, { transaction })

      if (dto.menus.length > 0) {
        await RoleMenu.bulkCreate(
          dto.menus.map(item => ({ roleId: res.id, menuId: item })),
          { updateOnDuplicate: ['roleId', 'menuId'], transaction }
        )
      }
      // if (orgList.length > 0) {
      //   console.log(orgList)
      //   await RoleOrganize.bulkCreate(
      //     orgList.map(item => ({ roleId: res.id, orgId: item })),
      //     { transaction }
      //   )
      // }
      await transaction.commit()
      return res
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  public async edit(dto: RoleEditDto, id: number, user: User, ip: string, loadModel) {
    const transaction = await Role.sequelize.transaction()
    try {
      let sysRole = await Role.findOne({ where: { id } })
      if (!sysRole) {
        throw new HttpException('角色不存在', 400)
      }
      if (dto.menus) {
        await RoleMenu.destroy({ where: { roleId: id }, force: true, transaction })
        let menuList = dto.menus
        await RoleMenu.bulkCreate(
          menuList.map(item => ({ roleId: id, menuId: item })),
          { transaction }
        )
        delete dto.menus
      }
      if (dto.orgs) {
        // await RoleOrganize.destroy({ where: { roleId: id }, transaction })
        // await RoleOrganize.bulkCreate(dto.orgs.map(item => ({ roleId: id, orgId: item })), { transaction })
      }
      await sysRole.update(dto, { transaction })

      await transaction.commit()

      // await SYSBusinessLog.create({
      // 	description: '修改角色',
      // 	params: `${id}`,
      // 	userId: user.id,
      // 	module: SYS_MODULE.ROLE,
      // });
      sysRole = await Role.findOne({ where: { id } })
      // await SYSBusinessLog.create({module:'角色管理',ip,userId:user.id,behavioral:'修改',description:user.name+'编辑了角色'+id,params:''+dto})
      return sysRole
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  // public async editPower(dto: ESYSRolePowerDto, id: number) {
  // 	let SYSRoleMenu = await SYSRole.findOne({ where: { id } });
  // 	if (!SYSRoleMenu) {
  // 		throw new HttpException('数据不存在', 400);
  // 	}
  // 	await SYSRoleMenu.update(dto);
  // 	SYSRoleMenu = await SYSRole.findOne({ where: { id } });
  // 	return SYSRoleMenu;
  // }

  public async delete(id: number, user: User, ip: string, loadModel) {
    const count = await User.count({ where: { roleId: id } });
    if (count > 0) {
    	throw new HttpException('该角色有用户正在使用!', 400);
    }
    const result = await Role.destroy({
      where: {
        id: id,
      },
    })
    // await SYSBusinessLog.create({module:'角色管理',ip,userId:user.id,behavioral:'删除',description:user.name+'删除了角色',params:''+id})
    return result
  }

  public async find(id: number, loadModel) {
    const options: FindOptions = {
      where: { id },
      include: [{ all: true }],
    }
    const result = await Role.findOne(options)
    return result
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, loadModel) {
    const options: FindPaginationOptions = {
      where: {},
      include: [
        {
          association: 'menuList',
          attributes: ['id', 'name', 'parentId', 'url', 'perms', 'sort', 'status', 'types'],
          required: false,
        },
        {
          association: 'orgList',
          attributes: ['id', 'name', 'parentId', 'sort', 'code'],
          where: { status: 1 },
          required: false,
        },
      ],
      pagination,
    }
    if (dto.name) {
      options.where['name'] = {
        [Op.like]: `%${dto.name}%`,
      }
    }

    if (dto.remark) {
      options.where['remark'] = {
        [Op.like]: `%${dto.remark}%`,
      }
    }
    if (dto.dataScopeType) {
      options.where['dataScopeType'] = {
        [Op.eq]: dto.dataScopeType,
      }
    }

    if (dto.status) {
      const statusString = String(dto.status).toLowerCase().trim() // 确保字符串统一处理
      const statusBoolean = statusString === 'true' || statusString === '1' // 转换逻辑
      options.where['status'] = {
        [Op.eq]: statusBoolean,
      }
    }
    const result = await Paging.diyPaging(Role, pagination, options)
    for (const res of result.data) {
      const temp = await RoleMenu.findOne({ where: { roleId: res.id } })
      if (temp != null) {
        res.setDataValue('type', '已配置')
      } else {
        res.setDataValue('type', '未配置')
      }
    }
    return result
  }

  public async editRoleMenuPower(dtos: RoleMenuPowerDto, roleId: number, user: User, loadModel) {
    if (!roleId) throw new HttpException('请携带角色ID修改权限', 400)
    if (!(await Role.findByPk(roleId))) throw new HttpException('未查询到该角色', 400)
    let res = false
    // 先将角色操作权限全下了 再根据传过来的code判断哪个勾选上
    // await SYSRoleMenuAction.update({ status: 0 }, { where: { roleId: roleId } })
    for (const dto of dtos.arr) {
      //权限选择自定义
      if (dto.dataScopeType === DATA_SCOPE_TYPE.CUSTOM) {
        const roleMenus = await RoleMenu.findAll({
          where: {
            menuId: dto.menuId,
            roleId: roleId,
          },
        })
      }
      // await SYSMenuAction.update(
      // 	{ status: dto.status },
      // 	{
      // 		where: {
      // 			menuId: dto.menuId,
      // 			code: dto.code,
      // 		},
      // 	},
      // );
      // 如果传过来的操作菜单编号有值则将其在RoleMenuAction中的状态改为1
      // if (dto.code.length) {
      // 	for (const str of dto.code) {
      // 		const temp = await SYSMenuAction.findOne({ where: { menuId: dto.menuId, code: str } })
      // 		await SYSRoleMenuAction.update({ status: 1 }, { where: { menuActionId: temp.id, roleId: roleId } })
      // 	}
      // } else {
      // 	const list = await SYSMenuAction.findAll({ where: { menuId: dto.menuId } })
      // 	for (const sysMenuAction of list) {
      // 		await SYSRoleMenuAction.update({ status: 0 }, { where: { menuActionId: sysMenuAction.id, roleId: roleId } })
      // 	}
      // }

      // if (dto.menuId) {
      // 	await SYSRoleMenu.update(
      // 		{ status: 1 },
      // 		{
      // 			where: {
      // 				menuId: dto.menuId,
      // 				roleId: roleId,
      // 			},
      // 		},
      // 	);
      // } else {
      // 	await SYSRoleMenu.update(
      // 		{ status: 0 },
      // 		{
      // 			where: {
      // 				menuId: dto.menuId,
      // 				roleId: roleId,
      // 			},
      // 		},
      // 	);
      // }
      // await SYSRoleMenu.update(
      // 	{ dataScopeType: dto.dataScopeType },
      // 	{
      // 		where: {
      // 			menuId: dto.menuId,
      // 			roleId: roleId,
      // 		},
      // 	},
      // );
    }
    res = true
    // await SYSBusinessLog.create({
    // 	description: '修改角色权限',
    // 	params: `${roleId}`,
    // 	userId: user.id,
    // 	module: SYS_MODULE.ROLE,
    // });
    return res
  }

  public async importExcel(buffer: Buffer, loadModel) {
    const mapper: JsExclKey[] = [
      {
        keyName: '角色名称', // Excel列的名称
        key: 'roleName', // 物料Model类中的属性名
      },
      {
        keyName: '备注',
        key: 'phone',
      },
    ]
    let result = {}
    let roleSuccess = 0
    let roleUpdate = 0
    let roleFailed = 0
    let total = 0
    let errors: Array<string> = []

    // 将当前Sheet的数据转换为JSON
    const json = await Aide.excelToJson(buffer, mapper)
    // 遍历每行数据并保存到数据库
    for (const rowElement of json.row) {
      if (rowElement.roleName) {
        const role = await Role.findOne({ where: { name: trim(rowElement.roleName) } })
        if (!role) {
          await Role.create({ name: trim(rowElement.roleName), status: 1, remark: trim(rowElement.remark) })
          roleSuccess++
        } else {
          roleFailed++
        }
      }
      total++
    }
    result = { total, success: roleSuccess, update: roleUpdate, failed: roleFailed }
    return result
  }
}
