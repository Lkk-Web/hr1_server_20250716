import { ProductSerialStatus } from '@common/enum'
import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString, IsEnum, IsNumber } from 'class-validator'

export class FindProductSerialDto {
  @ApiProperty({ description: '产品序列号', required: false })
  @IsOptional()
  @IsString()
  serialNumber?: string

  @ApiProperty({ description: '生产订单任务ID', required: false })
  @IsOptional()
  @IsString()
  productionOrderTaskId?: string

  @ApiProperty({ description: '状态', enum: ProductSerialStatus, required: false })
  @IsOptional()
  @IsEnum(ProductSerialStatus)
  status?: ProductSerialStatus

  @ApiProperty({ description: '质量状态', required: false })
  @IsOptional()
  @IsString()
  qualityStatus?: string

  @ApiProperty({ description: '订单编码', required: false })
  @IsOptional()
  @IsString()
  orderCode?: string
}

export class UpdateProductSerialDto {
  @ApiProperty({ description: '状态', enum: ProductSerialStatus, required: false })
  @IsOptional()
  @IsEnum(ProductSerialStatus)
  status?: ProductSerialStatus

  @ApiProperty({ description: '当前工序任务ID', required: false })
  @IsOptional()
  @IsString()
  currentProcessTaskId?: number

  @ApiProperty({ description: '质量状态', required: false })
  @IsOptional()
  @IsString()
  qualityStatus?: string

  @ApiProperty({ description: '备注', required: false })
  @IsOptional()
  @IsString()
  remark?: string
}

export class UpdateProcessProgressDto {
  @ApiProperty({ description: '工序任务ID', required: true })
  @IsString()
  processTaskId: number

  @ApiProperty({ description: '工序状态', required: true })
  @IsString()
  status: string

  @ApiProperty({ description: '实际开始时间', required: false })
  @IsOptional()
  actualStartTime?: Date

  @ApiProperty({ description: '实际结束时间', required: false })
  @IsOptional()
  actualEndTime?: Date
}