import { StationAuth } from '@core/decorator/controller'
import { Body, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { UserLoginDto } from './user.dto'
import { Organize, Role, User } from '@model/index'
import { CryptoUtil, jwtEncodeInExpire } from '@library/utils/crypt.util'
import { PLATFORM } from '@common/enum'
import E from '@common/error'
import { OpenAuthorize } from '@core/decorator/metaData'

@ApiTags('用户')
@ApiBearerAuth()
@StationAuth('user')
export class UserController {
  @ApiOperation({ summary: '登录' })
  @OpenAuthorize()
  @Post('login')
  async login(@Body() dto: UserLoginDto) {
    console.log('dto: ', dto, CryptoUtil.hashing(dto.password))
    let user: User = await User.findOne({ where: { phone: dto.code } })
    if (!user) {
      throw E.USER_NOT_EXISTS
    } else if (CryptoUtil.hashing(dto.password) != user.password) {
      throw E.INVALID_PASSWORD
    }

    user = await User.findOne({
      where: { id: user.id },
      attributes: ['id', 'phone', 'userName', 'station', 'email'],
      include: [
        {
          model: Role,
          attributes: ['id', 'code', 'name', 'dataScopeType'],
          required: false,
        },
        {
          model: Organize,
          attributes: ['id', 'code', 'name', 'address'],
          required: false,
        },
      ],
    })

    return {
      token: jwtEncodeInExpire({
        platform: PLATFORM.station,
        id: user.id,
        name: user.userName,
        // permissions,
      }),
      user,
    }
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '部门人员列表' })
  @Get('list')
  async userList(@Req() req) {
    return User.findAll({
      attributes: ['id', 'userCode', 'userName', 'phone'],
      include: [{ association: 'teamUsers', attributes: [], where: { teamId: req.team.id } }],
    })
  }
}
