import { ApiProperty } from '@nestjs/swagger'
import { Pagination } from './interface'
import { TableNames } from './constant'
import { Dayjs } from 'dayjs'

export class PaginationDto implements Pagination {
  @ApiProperty({
    name: 'current',
    required: false,
    description: '页码',
    type: Number,
  })
  current: number

  @ApiProperty({
    name: 'pageSize',
    required: false,
    description: '每页数量',
    type: Number,
  })
  pageSize: number
}

export class deleteIdsDto {
  @ApiProperty({
    required: false,
    description: 'id数组',
    type: [Number],
  })
  ids: number[]
}

export class SearchDto {
  @ApiProperty({
    name: 'key',
    required: true,
    description: '关键字',
    type: String,
  })
  key: string
}

export class KingdeeDto {
  @ApiProperty({
    name: 'key',
    required: true,
    description: '关键字',
    type: String,
  })
  key: string

  @ApiProperty({
    name: 'tableName',
    required: true,
    description: '表名称',
    type: String,
  })
  tableName: string
}

export class SyncKingdeeDto {
  @ApiProperty({
    name: 'tableName',
    enum: TableNames, // 指定枚举类型
    default: TableNames.部门, // 指定默认值
  })
  tableName: string
}

export class TimeDto {
  @ApiProperty({
    name: 'startTime',
    type: Date,
    required: false,
    description: '开始时间',
  })
  startTime?: string | number | Date | Dayjs

  @ApiProperty({
    name: 'endTime',
    type: Date,
    required: false,
    description: '结束时间',
  })
  endTime?: string | number | Date | Dayjs
}
