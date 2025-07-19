import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { All, Body, Get, HttpCode, HttpStatus, Inject, Param, Post, Put, Query, Req, Controller, HttpException } from '@nestjs/common'
import { GitNotifyData } from './hook.dto'
import { OpenAuthorize } from '@core/decorator/metaData'
// import * as request from 'request-promise'
import { HookService } from './hook.service'
import { HookTwoService } from './hookTwo.service'
import { CryptoUtil, jwtEncodeInExpire } from '@library/utils/crypt.util'
import { FileMenu, Menu, Organize, Role, RoleOrganize, TrendsTemplate, User } from '@model/index'
import { CensorParamPipe } from '@core/pipe/censorParam.pipe'
import { PLATFORM } from '@common/enum'
import E from '@common/error'
import { ThirdController } from '@core/decorator/controller'
import { Aide } from '@library/utils/aide'
import * as fs from 'fs'
import path = require('path')
import { env } from 'process'
import { UserRegisterDto } from '@modules/admin/mi/mi.dto'

// 用于和第三方API对接
@ThirdController('')
export class HookController {
  constructor(
    // @Inject(RedisProvider.local)
    // private readonly redis: SuperRedis,
    private readonly service: HookService,
    private readonly serviceTwo: HookTwoService
  ) {}

  @OpenAuthorize()
  @Post('git/cli')
  @ApiOperation({ summary: 'git自动部署' })
  @HttpCode(HttpStatus.OK)
  async gitCi(@Param() params, @Req() req, @Body() body: GitNotifyData, @Query() query) {
    await this.serviceTwo.gitCi(body)
    return true
  }

  /*------------------------- 和平台端的接口 -------------------------*/
  @Post('platform/newFactory')
  @ApiOperation({ summary: '初始化一个新工厂' })
  @HttpCode(HttpStatus.OK)
  async initNewFactory(@Body() dto: UserRegisterDto, @Req() req) {
    // 初始化一个工厂默认数据表
    let count = await Role.count()
    if (count) {
      throw E.API_FACTORY_DATA_EXSITS
    }
    let filePath = path.join(path.dirname(__filename), '../../../doc/new_factory_data.xlsx')
    let file = await fs.readFileSync(filePath)
    let xlsData = await Aide.excelToJson2(file)
    for (let index = 0; index < xlsData.length; index++) {
      const { name, data } = xlsData[index]
      switch (name) {
        case 'sys_org':
          await Organize.bulkCreate(data)
          break
        case 'sys_role':
          await Role.bulkCreate(data)
          break
        case 'sys_role_org':
          await RoleOrganize.bulkCreate(data)
          break
        case 'trendsTemplate':
          await TrendsTemplate.bulkCreate(data)
          break
        case 'sys_menu':
          // await Menu.bulkCreate(data)
          // 由于有父级需要循环添加
          for (let i = 0; i < data.length; i++) {
            const element = data[i]
            await Menu.create(element)
          }
          break
        case 'dm_file_menu':
          await FileMenu.bulkCreate(data)
          break
      }
    }
    return { result: 'OK' }
  }

  @Post('platform/createUser')
  @ApiOperation({ summary: '创建关联用户' })
  @HttpCode(HttpStatus.OK)
  async platformCreateUser(@Body() dto: UserRegisterDto, @Req() req) {
    const { factoryCode, loadModel } = req
    console.log('req: ', factoryCode, loadModel)
    const fjs = dto.appKey
    let key = env.MES_KEY + fjs
    //获取openId以及手机号
    const res = CryptoUtil.sm4Decrypt(dto.text)
    const str = res.split('&')
    console.log(str)
    //创建用户
    const user = await User.create({
      userCode: '10001',
      phone: str[0],
      openId: str[1],
      userName: str[2],
      departmentId: 4,
      roleId: 1,
      status: true,
    })
    return user
  }

  @ApiOperation({ summary: '同步models' })
  @Post('platform/syncModels')
  async syncModels() {
    return true
  }
}
