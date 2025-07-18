import { OpenAuthorize } from '@core/decorator/metaData'
import { ClientAuth } from '@core/decorator/controller'
import { Body, Get, HttpCode, HttpException, HttpStatus, Param, Post, Query, Req, UploadedFile, UseInterceptors } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { FindPaginationDto, OrderProgressDto, performanceDto, RoleBoardDto, ScheduleFindPaginationDto, taskBoardDto, taskProgressDto, UserLoginDto } from './mi.dto'
import { MiService } from './mi.service'
import { FileInterceptor } from '@nestjs/platform-express'
import { Aide } from '@library/utils/aide'
import { FileUploadDto } from '../../file/file.dto'
import { CensorParamPipe } from '@core/pipe/censorParam.pipe'
import { CurrentPage } from '@core/decorator/request'
import { Pagination } from '@common/interface'
import { MiService as ClientMiService } from '@modules/admin/mi/mi.service'

@ApiTags('我的')
@ApiBearerAuth()
@ClientAuth('mi')
// @OpenAuthorize()
export class MiController {
  constructor(private readonly service: MiService, private readonly clientMiService: ClientMiService) {}

  @ApiOperation({ summary: '登录' })
  @OpenAuthorize()
  @Post('login')
  async postToken(@Body(new CensorParamPipe(new UserLoginDto())) dto: UserLoginDto, @Req() req) {
    const data = await this.service.login(dto)
    return data
  }

  @ApiOperation({ summary: '根据token获取个人信息' })
  @HttpCode(HttpStatus.OK)
  @Get('info')
  async getInfo(@Req() req) {
    return this.service.getInfo(req.user)
  }

  @ApiOperation({ summary: '车间总览' })
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'type', required: true, description: 'type', type: String })
  @Get('board/:type')
  async board(@Param() param, @Req() req, @Query() dto: FindPaginationDto, @CurrentPage() pagination: Pagination) {
    return this.service.board(param.type, req.user, dto, pagination)
  }

  @ApiOperation({ summary: '生产进度' })
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'type', required: true, description: 'type', type: String })
  @Get('schedule/:type')
  async schedule(@Param() param, @Req() req, @Query() dto: ScheduleFindPaginationDto) {
    return this.service.schedule(param.type, req.user, dto)
  }

  @ApiOperation({ summary: '生产进度工序任务数据' })
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'type', required: true, description: 'type', type: String })
  @Get('taskBoard/:type')
  async taskBoard(@Param() param, @Req() req, @Query() dto: taskBoardDto) {
    return this.service.taskBoard(param.type, req.user, dto)
  }

  @ApiOperation({ summary: '绩效工资' })
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'type', required: true, description: 'type', type: String })
  @Get('performance/:type')
  async performance(@Param() param, @Req() req, @Query() dto: performanceDto) {
    return this.service.performance(param.type, req.user, dto)
  }

  @ApiOperation({ summary: '首页' })
  @HttpCode(HttpStatus.OK)
  @Get('home')
  async home(@Req() req) {
    return this.service.home(req.user)
  }

  @ApiOperation({ summary: '角色看板' })
  @HttpCode(HttpStatus.OK)
  @Get('roleBoard')
  async managerBoard(@Query() dto: RoleBoardDto, @Req() req) {
    return this.clientMiService.roleBoard(dto, req.user)
  }

  @ApiOperation({ summary: '工单进度' })
  @HttpCode(HttpStatus.OK)
  @Get('orderProgress')
  async orderProgress(@Req() req, @Query() dto: OrderProgressDto) {
    return this.service.orderProgress(req.user, dto)
  }

  @ApiOperation({ summary: '部门工序进度' })
  @HttpCode(HttpStatus.OK)
  @Get('deptProgress')
  async deptProgress(@Req() req, @Query() dto: taskProgressDto) {
    return this.service.deptProgress(req.user, dto)
  }

  @ApiOperation({ summary: '绩效排名' })
  @HttpCode(HttpStatus.OK)
  @Get('salary')
  async salary(@Req() req, @Query() dto: OrderProgressDto) {
    return this.service.salary(req.user, dto)
  }

  @ApiOperation({ summary: '文件上传' })
  @OpenAuthorize()
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
    if (!file) throw new HttpException(null, 400014)
    const result = await Aide.bufferUpOSS(file.buffer, req.headers['filename'] || file.originalname)
    return result
  }
}
