import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { Get, HttpCode, HttpStatus, Param, Query, Req } from '@nestjs/common'
import { StationAuth } from '@core/decorator/controller'
import { BomService } from './bom.service'
import { materialListDto, QDrawingDto } from './bom.dto'
import { OpenCache } from '@library/cache/cache'
import { DrawingTool } from '@library/utils/drawing'

@ApiTags('bom')
@ApiBearerAuth()
@StationAuth('bom')
export class BomController {
  constructor(private readonly service: BomService) {}

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '物料清单' })
  @Get('material/list')
  @OpenCache({ ttl: 60000 * 3, isQuery: (v: materialListDto) => v.serialId })
  async materialList(@Query() dto: materialListDto) {
    const result = await this.service.materialList(dto)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '作业指导书详情' })
  @ApiParam({ name: 'materialId', required: true, description: '物料id', type: Number })
  @Get('sop/:materialId')
  async sopFind(@Param('materialId') materialId: number, @Req() req) {
    return this.service.sopFind(materialId, req.process.id)
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '获取图纸' })
  @Get('drawing')
  async drawing(@Query() dto: QDrawingDto) {
    return {
      url: await DrawingTool.getDrawingUrl(dto.code, dto.fileType),
    }
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '获取工艺' })
  @Get('craft/:code')
  @ApiParam({ name: 'code', description: '物料编码' })
  async getCraft(@Param('code') code: string) {
    return this.service.getCraft(code)
  }
}
