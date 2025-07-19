import { OpenAuthorize } from '@core/decorator/metaData'
import { StationAuth } from '@core/decorator/controller'
import { Body, Get, HttpCode, HttpException, HttpStatus, Post, Query, Req, UploadedFile, UseInterceptors } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger'
import { MiService } from './mi.service'
import { CensorParamPipe } from '@core/pipe/censorParam.pipe'
import { OrgDto, PadLoginDto, PadTeamListDto, ProcessDto, TeamLoginDto, UserPasswordLoginDto } from './mi.dto'
import { FileInterceptor } from '@nestjs/platform-express'
import { FileUploadDto } from '@modules/file/file.dto'
import { User } from '@model/auth/user.model'

@ApiTags('我的')
@ApiBearerAuth()
@StationAuth('mi')
export class MiController {
  constructor(private readonly service: MiService) {}

  @ApiOperation({ summary: '部门登录【弃用】' })
  @OpenAuthorize()
  @Post('padLogin')
  async padLogin(@Body(new CensorParamPipe()) dto: PadLoginDto, @Req() req) {
    const data = await this.service.padLogin(dto)
    return data
  }

  @ApiOperation({ summary: '班组登录' })
  @OpenAuthorize()
  @Post('team/login')
  async teamLogin(@Body(new CensorParamPipe()) dto: UserPasswordLoginDto) {
    return this.service.teamLogin(dto)
  }

  @ApiOperation({ summary: '班组切换' })
  @HttpCode(HttpStatus.OK)
  @Post('team/switch')
  async switchTeam(@Body(new CensorParamPipe()) dto: TeamLoginDto, @Req() req) {
    return this.service.switchTeam(dto, req.team.teamUser.userId)
  }

  @ApiOperation({ summary: '根据token获取部门及工序信息' })
  @HttpCode(HttpStatus.OK)
  @Get('info')
  async getInfo(@Req() req) {
    const user = await User.findByPk(req.team.teamUser.userId, { attributes: ['id', 'userCode', 'code', 'phone', 'userName'] })
    return { team: req.team, process: req.process, user }
  }

  @ApiOperation({ summary: '获取部门' })
  @HttpCode(HttpStatus.OK)
  @OpenAuthorize()
  @Get('getOrg')
  async getOrg(@Query() dto: OrgDto) {
    return this.service.getOrg(dto)
  }

  @ApiOperation({ summary: '获取工序' })
  @HttpCode(HttpStatus.OK)
  @OpenAuthorize()
  @Get('getProcess')
  async getProcess(@Query() dto: ProcessDto) {
    return this.service.getProcess(dto)
  }

  @ApiOperation({ summary: '获取班组' })
  @HttpCode(HttpStatus.OK)
  @OpenAuthorize()
  @Get('team')
  async getTeam(@Query() dto: PadTeamListDto) {
    return this.service.getTeam(dto)
  }

  @ApiOperation({ summary: '文件上传' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fieldSize: 55555,
      },
    })
  )
  @ApiBody({
    description: '文件上传',
    type: FileUploadDto,
  })
  @HttpCode(HttpStatus.OK)
  @Post('upload')
  async upload(@UploadedFile() file, @Req() req) {
    // if (!file) throw new HttpException(null, 400014)
    // const result = await Aide.uploadFileMinio(file)
    // return result
  }

  // @ApiOperation({ summary: '根据token获取个人信息' })
  // @HttpCode(HttpStatus.OK)
  // @Get('info')
  // async getInfo(@Req() req) {
  //   return this.service.getInfo(req.user)
  // }
}
