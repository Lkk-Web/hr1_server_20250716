import { IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { DATE } from 'sequelize'

export class FindPaginationDto {
  // @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  // current?: string
  // @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  // pageSize?: string
  @ApiProperty({ name: 'batch', type: String, required: false, description: '批次号' })
  batch?: string
  @ApiProperty({ name: 'types', type: String, required: false, description: '追溯类型（来源追溯，去向追溯）' })
  types?: string
}

export class CBatchLogDto {
  @ApiProperty({ name: 'sourceBatch', type: String, required: false, description: '来源批次号' })
  sourceBatch?: string
  @ApiProperty({ name: 'goThereBatch', type: String, required: false, description: '去向批次号' })
  goThereBatch?: string
  @ApiProperty({ name: 'djName', type: String, required: false, description: '单据名称' })
  djName?: string
  @ApiProperty({ name: 'ywDate', type: Date, required: false, description: '业务日期' })
  ywDate?: Date
  @ApiProperty({ name: 'unit', type: String, required: false, description: '单位' })
  unit?: string
  @ApiProperty({ name: 'num', type: Number, required: false, description: '数量' })
  num?: number
  @ApiProperty({ name: 'materialId', type: Number, required: false, description: '物料Id' })
  materialId?: number
  @ApiProperty({ name: 'createdUserId', type: Number, required: false, description: '创建人id' })
  createdUserId?: number
  @ApiProperty({ name: 'warehouseId', type: Number, required: false, description: '仓库Id' })
  warehouseId?: number
}

export class UBatchLogDto {
  @ApiProperty({ name: 'sourceBatch', type: String, required: true, description: '来源批次号' })
  sourceBatch?: string
  @ApiProperty({ name: 'goThereBatch', type: String, required: false, description: '去向批次号' })
  goThereBatch?: string
  @ApiProperty({ name: 'oneBatch', type: String, required: false, description: '初始批次号' })
  oneBatch?: string
  @ApiProperty({ name: 'djName', type: String, required: false, description: '单据名称' })
  djName?: string
  @ApiProperty({ name: 'ywDate', type: Date, required: false, description: '业务日期' })
  ywDate?: Date
  @ApiProperty({ name: 'unit', type: String, required: false, description: '单位' })
  unit?: string
  @ApiProperty({ name: 'num', type: Number, required: false, description: '数量' })
  num?: number
  @ApiProperty({ name: 'materialId', type: Number, required: false, description: '物料Id' })
  materialId?: number
  @ApiProperty({ name: 'createdUserId', type: Number, required: false, description: '创建人id' })
  createdUserId?: number
  @ApiProperty({ name: 'warehouseId', type: Number, required: false, description: '仓库Id' })
  warehouseId?: number
}
