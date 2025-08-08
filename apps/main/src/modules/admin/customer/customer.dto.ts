import { IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Customer } from '@model/base/customer.model'

export class FindPaginationDto {
  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string
  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string
  @ApiProperty({
    description: '默认搜索',
    type: String,
    required: false,
  })
  selectAttr: string

  @ApiProperty({
    description: '联系人',
    type: String,
    required: false,
  })
  contactPerson: string

  @ApiProperty({
    description: '联系电话',
    type: String,
    required: false,
  })
  contactPhone: string
}

export class CCustomerDto {
  @ApiProperty({
    description: '客户全称',
    type: String,
    required: true,
  })
  fullName: string

  @ApiProperty({
    description: '联系人',
    type: String,
    required: false,
  })
  contactPerson: string

  @ApiProperty({
    description: '联系电话',
    type: String,
    required: false,
  })
  contactPhone: string

  @ApiProperty({
    description: '联系地址',
    type: String,
    required: false,
  })
  contactAddress: string
}

export class UCustomerDto {
  @ApiProperty({
    description: '客户全称',
    type: String,
    required: true,
  })
  fullName: string

  @ApiProperty({
    description: '联系人',
    type: String,
    required: false,
  })
  contactPerson: string

  @ApiProperty({
    description: '联系电话',
    type: String,
    required: false,
  })
  contactPhone: string

  @ApiProperty({
    description: '联系地址',
    type: String,
    required: false,
  })
  contactAddress: string
}
