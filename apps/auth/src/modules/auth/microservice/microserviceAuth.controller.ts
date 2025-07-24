import { Controller } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import { MiService } from '../base/base.service'
import { MicroserviceTokenVerifyDto } from '../base/base.dto'
import { User, UserRole, Role, Menu, RoleMenu } from '@model/index'
import { Op } from 'sequelize'

@Controller()
export class MicroserviceAuthController {
  constructor(private readonly miService: MiService) {}

  @MessagePattern('auth.verify.token')
  async verifyToken(@Payload() data: MicroserviceTokenVerifyDto) {
    try {
      const result = await this.miService.verifyMicroserviceToken(data)
      console.log('[Microservice] token验证成功', data.path, result.user.userName)
      return result
    } catch (error) {
      return {
        valid: false,
        message: error.message || 'Token验证失败',
      }
    }
  }

  @MessagePattern('auth.health.check')
  async healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'auth',
    }
  }

  @MessagePattern('user.find.by.id')
  async findUserById(@Payload() data: { userId: number }) {
    try {
      const user = await User.findOne({
        where: { id: data.userId },
        attributes: ['id', 'userCode', 'userName', 'phone', 'email', 'status'],
        include: [
          {
            model: Role,
            as: 'roles',
            through: { attributes: [] },
            attributes: ['id', 'code', 'name', 'dataScopeType'],
          },
        ],
      })

      if (!user) {
        return { success: false, message: '用户不存在' }
      }

      return { success: true, data: user }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  @MessagePattern('user.find.by.code')
  async findUserByCode(@Payload() data: { userCode: string }) {
    try {
      const user = await User.findOne({
        where: { userCode: data.userCode },
        attributes: ['id', 'userCode', 'userName', 'phone', 'email', 'status'],
        include: [
          {
            model: Role,
            as: 'roles',
            through: { attributes: [] },
            attributes: ['id', 'code', 'name', 'dataScopeType'],
          },
        ],
      })

      if (!user) {
        return { success: false, message: '用户不存在' }
      }

      return { success: true, data: user }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  @MessagePattern('user.find.by.phone')
  async findUserByPhone(@Payload() data: { phone: string }) {
    try {
      const user = await User.findOne({
        where: { phone: data.phone },
        attributes: ['id', 'userCode', 'userName', 'phone', 'email', 'status'],
        include: [
          {
            model: Role,
            as: 'roles',
            through: { attributes: [] },
            attributes: ['id', 'code', 'name', 'dataScopeType'],
          },
        ],
      })

      if (!user) {
        return { success: false, message: '用户不存在' }
      }

      return { success: true, data: user }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  @MessagePattern('user.get.role')
  async getUserRole(@Payload() data: { userId: number }) {
    try {
      const userRoles = await UserRole.findAll({
        where: { userId: data.userId },
        include: [
          {
            model: Role,
            as: 'role',
            attributes: ['id', 'code', 'name', 'dataScopeType'],
          },
        ],
      })

      return { success: true, data: userRoles }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  @MessagePattern('user.get.menus')
  async getUserMenus(@Payload() data: { userId: number }) {
    try {
      // 获取用户角色
      const userRoles = await UserRole.findAll({
        where: { userId: data.userId },
        attributes: ['roleId'],
      })

      const roleIds = userRoles.map(ur => ur.roleId)

      if (roleIds.length === 0) {
        return { success: true, data: [] }
      }

      // 获取角色对应的菜单
      const roleMenus = await RoleMenu.findAll({
        where: { roleId: roleIds },
        include: [
          {
            model: Menu,
            as: 'menu',
            attributes: ['id', 'name', 'code', 'path', 'icon', 'parentId', 'sort', 'type'],
          },
        ],
      })

      // 去重
      const uniqueMenus = roleMenus.filter((menu, index, self) => index === self.findIndex(m => m.id === menu.id))

      return { success: true, data: uniqueMenus }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  @MessagePattern('user.check.permission')
  async checkUserPermission(@Payload() data: { userId: number; permission: string }) {
    try {
      // 获取用户角色
      const userRoles = await UserRole.findAll({
        where: { userId: data.userId },
        attributes: ['roleId'],
      })

      const roleIds = userRoles.map(ur => ur.roleId)

      if (roleIds.length === 0) {
        return { success: true, data: false }
      }

      // 检查角色是否有对应权限
      const roleMenus = await RoleMenu.findAll({
        where: { roleId: roleIds },
        include: [
          {
            model: Menu,
            as: 'menu',
            where: { code: data.permission },
            attributes: ['id', 'code'],
          },
        ],
      })

      const hasPermission = roleMenus.length > 0
      return { success: true, data: hasPermission }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  @MessagePattern('user.list')
  async getUserList(@Payload() data: any) {
    try {
      const { page = 1, pageSize = 10, ...filters } = data
      const offset = (page - 1) * pageSize

      const where: any = {}
      if (filters.userCode) {
        where.userCode = { [Op.like]: `%${filters.userCode}%` }
      }
      if (filters.userName) {
        where.userName = { [Op.like]: `%${filters.userName}%` }
      }
      if (filters.phone) {
        where.phone = { [Op.like]: `%${filters.phone}%` }
      }
      if (filters.status !== undefined) {
        where.status = filters.status
      }

      const { count, rows } = await User.findAndCountAll({
        where,
        attributes: ['id', 'userCode', 'userName', 'phone', 'email', 'status', 'createdAt'],
        include: [
          {
            model: Role,
            as: 'roles',
            through: { attributes: [] },
            attributes: ['id', 'code', 'name'],
          },
        ],
        limit: pageSize,
        offset,
        order: [['createdAt', 'DESC']],
      })

      return {
        success: true,
        data: {
          list: rows,
          total: count,
          page,
          pageSize,
        },
      }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }
}
