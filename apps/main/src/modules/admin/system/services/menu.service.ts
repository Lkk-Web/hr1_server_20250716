import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Injectable } from '@nestjs/common'
import { Menu } from '@model/auth/menu'
import { CSYSMenuDto, ESYSMenuDto, FindPaginationDto } from '../dtos/menu.dto'
import { RoleMenu } from '@model/auth/roleMenu'
import { Role } from '@model/auth/role'
import { User } from '@model/auth/user'
import { FindOptions, Op, where } from 'sequelize'
import { STRUtil } from '@library/utils/str'
@Injectable()
export class SysMenuService {
  constructor(
    @InjectModel(Menu)
    private SYSMenuModel: typeof Menu
  ) {}

  public async create(dto: CSYSMenuDto, user: User, loadModel) {
    const temp = await Menu.findOne({ where: { name: dto.name } })
    if (temp) {
      throw new HttpException('已存在相同名字菜单', 400)
    }
    //添加菜单也需要给超级管理员添加权
    const result = await Menu.create(dto)
    const sysRole = await Role.findOne({ where: { name: '超级管理员' } })

    if (sysRole && result) {
      await RoleMenu.create({ roleId: sysRole.dataValues.id, menuId: result.dataValues.id })
    }

    return result
  }

  public async edit(dto: ESYSMenuDto, id: number, user: User, loadModel) {
    let sysMenu = await Menu.findOne({ where: { id } })
    if (!sysMenu) {
      throw new HttpException('数据不存在', 400)
    }
    if (dto.name) {
      const temp = await Menu.findOne({ where: { name: dto.name } })
      if (temp && temp.id != id) {
        throw new HttpException('已存在相同名字菜单', 400)
      }
    }
    await sysMenu.update(dto)
    sysMenu = await Menu.findOne({ where: { id } })
    return Menu
  }

  public async delete(id: number, user: User, loadModel) {
    //查询是否存在下级菜单，存在就提示报错，不存在就删除角色菜单关联表
    const resultOne = await Menu.findOne({ where: { parentId: id } })
    if (resultOne) {
      throw new HttpException('存在下级菜单，无法删除', 400)
    }
    //删除角色菜单关联表
    await RoleMenu.destroy({ where: { menuId: id } })
    const result = await Menu.destroy({
      where: {
        id: id,
      },
    })
    return result
  }

  public async find(id: number, loadModel) {
    const options: FindOptions = {
      where: { id },
      include: [{ all: true }],
    }
    const result = await Menu.findOne(options)
    return result
  }

  public async findPagination(dto: FindPaginationDto, loadModel) {
    const options: FindOptions = {
      where: {},
    }
    if (dto.name) {
      options.where['name'] = {
        [Op.eq]: dto.name,
      }
    }
    if (dto.parentId) {
      options.where['parentId'] = {
        [Op.eq]: dto.parentId,
      }
    }
    if (dto.perms) {
      options.where['perms'] = {
        [Op.like]: `%${dto.perms}%`,
      }
    }
    if (dto.types) {
      options.where['types'] = {
        [Op.eq]: dto.types,
      }
    }
    if (dto.status) {
      const statusString = String(dto.status).toLowerCase().trim() // 确保字符串统一处理
      const statusBoolean = statusString === 'true' || statusString === '1' // 转换逻辑
      options.where['status'] = {
        [Op.eq]: statusBoolean,
      }
    }
    // @ts-ignore
    const menus = await Menu.findAll<Menu>(options)
    let endMenus = JSON.parse(JSON.stringify(menus))
    let result = STRUtil.buildMenuTree(endMenus)
    return result
  }
}
