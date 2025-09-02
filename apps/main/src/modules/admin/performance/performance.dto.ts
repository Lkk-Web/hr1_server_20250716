import { PaginationDto } from '@common/dto'
import { ApiProperty } from '@nestjs/swagger'
import { Dayjs } from 'dayjs'
import { IsNotEmpty } from 'class-validator'

export class performanceCreateDto {
  @ApiProperty({ required: true, description: '物料id', type: [Number] })
  @IsNotEmpty({ message: '物料id不能为空' })
  materialId: number[]

  @ApiProperty({ required: true, description: '产品规格', type: String })
  productSpec: string

  @ApiProperty({ required: true, description: '工序id', type: Number })
  processId: number

  @ApiProperty({ required: true, description: '工价', type: Number })
  price: number
}

export class performanceUpdateDto {
  @ApiProperty({ required: false, description: '物料id', type: [Number] })
  @IsNotEmpty({ message: '物料id不能为空' })
  materialId?: number[]

  @ApiProperty({ required: false, description: '产品规格', type: String })
  productSpec?: string

  @ApiProperty({ required: false, description: '工序id', type: Number })
  processId?: number

  @ApiProperty({ required: false, description: '状态', type: Number })
  status?: number

  @ApiProperty({ required: false, description: '工价', type: Number })
  price?: number
}

export class FindPaginationDto {
  @ApiProperty({ required: false, description: '产品规格', type: String })
  productSpec?: string

  @ApiProperty({ required: false, description: '状态', type: Number })
  status?: number

  @ApiProperty({ required: false, description: '工价', type: Number })
  price?: number
}

export class findProductSpecDto {
  @ApiProperty({ required: true, description: '物料名称', type: String })
  @IsNotEmpty({ message: '物料名称不能为空' })
  materialName: string
}

export class FindPaginationTotalDto {
  @ApiProperty({ required: false, description: '班组ID', type: Number })
  teamId?: number

  @ApiProperty({ required: false, description: '员工ID', type: Number })
  updatedUserId?: number

  @ApiProperty({ required: false, description: '工位ID', type: Number })
  positionId?: number

  @ApiProperty({ required: false, description: '物料Id', type: Number })
  materialId?: number

  @ApiProperty({ required: false, description: '产品规格', type: String })
  productSpec?: string

  @ApiProperty({
    description: '开始时间',
    type: Date,
    required: false,
  })
  startTime?: Date

  @ApiProperty({
    description: '结束时间',
    type: Date,
    required: false,
  })
  endTime?: Date
}
