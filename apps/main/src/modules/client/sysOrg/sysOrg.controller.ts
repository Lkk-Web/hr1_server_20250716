import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Get, HttpCode, HttpStatus, Query, Req } from '@nestjs/common'
import { ClientAuth } from '@core/decorator/controller'
import { SysOrgService } from './sysOrg.service'
import { OpenAuthorize } from '@core/decorator/metaData'
import { FindAllDto } from '@modules/admin/system/dtos/SYSOrg.dto'

@ApiTags('组织/部门')
@ApiBearerAuth()
@ClientAuth('SYSOrg')
export class SysOrgController {
  constructor(private readonly service: SysOrgService) {}

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '列表' })
  @Get('findPagination')
  @OpenAuthorize()
  async findPagination(@Query() dto: FindAllDto, @Req() req) {
    const result = await this.service.findAll(dto)
    return result
  }
}
