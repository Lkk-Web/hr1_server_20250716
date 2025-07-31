import { ProductionOrderTaskStatus } from '@common/enum'
import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString, IsNumber, IsDateString, IsIn, IsEnum } from 'class-validator'

export class FindProductionOrderTaskDto {
  @ApiProperty({ description: '任务编码', required: false })
  @IsOptional()
  @IsString()
  orderCode?: string

  @ApiProperty({ description: '物料名称', required: false })
  @IsOptional()
  @IsString()
  materialName?: string

  @ApiProperty({ description: '状态', enum: ProductionOrderTaskStatus, required: false })
  @IsOptional()
  @IsEnum(ProductionOrderTaskStatus)
  status?: ProductionOrderTaskStatus

  @ApiProperty({ description: '车间', required: false })
  @IsOptional()
  @IsString()
  workShop?: string

  @ApiProperty({ description: '订单详情编码', required: false })
  @IsOptional()
  @IsString()
  productionOrderDetailCode?: string
}

export class UpdateProductionOrderTaskDto {
  @ApiProperty({ description: '良品数', required: false })
  @IsOptional()
  @IsNumber()
  goodCount?: number

  @ApiProperty({ description: '不良品数', required: false })
  @IsOptional()
  @IsNumber()
  badCount?: number

  @ApiProperty({ description: '实际产出', required: false })
  @IsOptional()
  @IsNumber()
  actualOutput?: number

  @ApiProperty({ description: '状态', enum: ProductionOrderTaskStatus, required: false })
  @IsOptional()
  @IsEnum(ProductionOrderTaskStatus)
  status?: ProductionOrderTaskStatus

  @ApiProperty({ description: '优先级', required: false })
  @IsOptional()
  @IsString()
  priority?: string

  @ApiProperty({ description: '车间', required: false })
  @IsOptional()
  @IsString()
  workShop?: string

  @ApiProperty({ description: '备注', required: false })
  @IsOptional()
  @IsString()
  remark?: string

  @ApiProperty({ description: '计划开始时间', required: false })
  @IsOptional()
  @IsDateString()
  planStartTime?: Date

  @ApiProperty({ description: '计划结束时间', required: false })
  @IsOptional()
  @IsDateString()
  planEndTime?: Date

  @ApiProperty({ description: '实际开始时间', required: false })
  @IsOptional()
  @IsDateString()
  actualStartTime?: Date

  @ApiProperty({ description: '实际结束时间', required: false })
  @IsOptional()
  @IsDateString()
  actualEndTime?: Date
}

export class ProductionOrderTaskActionDto {
  @ApiProperty({ description: '操作类型', enum: ['start', 'pause', 'resume', 'cancel', 'complete'] })
  @IsIn(['start', 'pause', 'resume', 'cancel', 'complete'])
  action: string

  @ApiProperty({ description: '备注', required: false })
  @IsOptional()
  @IsString()
  remark?: string
}