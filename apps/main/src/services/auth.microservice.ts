import { Injectable, Inject, HttpException } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { firstValueFrom, timeout, catchError } from 'rxjs'
import { of } from 'rxjs'

@Injectable()
export class AuthMicroserviceService {
  constructor(@Inject('AUTH_SERVICE') private readonly authClient: ClientProxy) {}

  /**
   * 通过用户ID获取用户信息
   */
  async getUserById(userId: number) {
    try {
      const result = await firstValueFrom(
        this.authClient.send('user.find.by.id', { userId }).pipe(
          timeout(5000),
          catchError(error => {
            console.error('[AuthMicroserviceService] 获取用户信息失败:', error.message)
            return of({ success: false, message: error.message })
          })
        )
      )

      if (result.success) {
        return result.data
      } else {
        throw new HttpException(result.message || '获取用户信息失败', 500)
      }
    } catch (error) {
      throw new HttpException('微服务调用失败', 500)
    }
  }

  /**
   * 通过用户代码获取用户信息
   */
  async getUserByCode(userCode: string) {
    try {
      const result = await firstValueFrom(
        this.authClient.send('user.find.by.code', { userCode }).pipe(
          timeout(5000),
          catchError(error => {
            console.error('[AuthMicroserviceService] 获取用户信息失败:', error.message)
            return of({ success: false, message: error.message })
          })
        )
      )

      if (result.success) {
        return result.data
      } else {
        throw new HttpException(result.message || '获取用户信息失败', 500)
      }
    } catch (error) {
      throw new HttpException('微服务调用失败', 500)
    }
  }

  /**
   * 通过手机号获取用户信息
   */
  async getUserByPhone(phone: string) {
    try {
      const result = await firstValueFrom(
        this.authClient.send('user.find.by.phone', { phone }).pipe(
          timeout(5000),
          catchError(error => {
            console.error('[AuthMicroserviceService] 获取用户信息失败:', error.message)
            return of({ success: false, message: error.message })
          })
        )
      )

      if (result.success) {
        return result.data
      } else {
        throw new HttpException(result.message || '获取用户信息失败', 500)
      }
    } catch (error) {
      throw new HttpException('微服务调用失败', 500)
    }
  }

  /**
   * 获取用户角色信息
   */
  async getUserRole(userId: number) {
    try {
      const result = await firstValueFrom(
        this.authClient.send('user.get.role', { userId }).pipe(
          timeout(5000),
          catchError(error => {
            console.error('[AuthMicroserviceService] 获取用户角色失败:', error.message)
            return of({ success: false, message: error.message })
          })
        )
      )

      if (result.success) {
        return result.data
      } else {
        throw new HttpException(result.message || '获取用户角色失败', 500)
      }
    } catch (error) {
      throw new HttpException('微服务调用失败', 500)
    }
  }

  /**
   * 获取用户菜单权限
   */
  async getUserMenus(userId: number) {
    try {
      const result = await firstValueFrom(
        this.authClient.send('user.get.menus', { userId }).pipe(
          timeout(5000),
          catchError(error => {
            console.error('[AuthMicroserviceService] 获取用户菜单失败:', error.message)
            return of({ success: false, message: error.message })
          })
        )
      )

      if (result.success) {
        return result.data
      } else {
        throw new HttpException(result.message || '获取用户菜单失败', 500)
      }
    } catch (error) {
      throw new HttpException('微服务调用失败', 500)
    }
  }

  /**
   * 验证用户权限
   */
  async checkUserPermission(userId: number, permission: string) {
    try {
      const result = await firstValueFrom(
        this.authClient.send('user.check.permission', { userId, permission }).pipe(
          timeout(5000),
          catchError(error => {
            console.error('[AuthMicroserviceService] 验证用户权限失败:', error.message)
            return of({ success: false, message: error.message })
          })
        )
      )

      if (result.success) {
        return result.data
      } else {
        throw new HttpException(result.message || '验证用户权限失败', 500)
      }
    } catch (error) {
      throw new HttpException('微服务调用失败', 500)
    }
  }

  /**
   * 获取用户列表（分页）
   */
  async getUserList(params: any) {
    try {
      const result = await firstValueFrom(
        this.authClient.send('user.list', params).pipe(
          timeout(10000), // 列表查询可能需要更长时间
          catchError(error => {
            console.error('[AuthMicroserviceService] 获取用户列表失败:', error.message)
            return of({ success: false, message: error.message })
          })
        )
      )

      if (result.success) {
        return result.data
      } else {
        throw new HttpException(result.message || '获取用户列表失败', 500)
      }
    } catch (error) {
      throw new HttpException('微服务调用失败', 500)
    }
  }
}
