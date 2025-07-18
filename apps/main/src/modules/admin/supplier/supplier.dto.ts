import { IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Supplier } from '@model/base/supplier.model'

export class FindPaginationDto {
  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string
  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string

  @ApiProperty({ name: 'default', type: String, required: false, description: 'default' })
  default?: string

  @ApiProperty({
    name: 'code',
    required: false,
    description: '编码，忽略时自动生成',
    type: String,
  })
  code?: string

  @ApiProperty({
    name: 'shortName',
    required: false,
    description: '供应商简称，必填',
    type: String,
  })
  shortName: string

  @ApiProperty({
    name: 'fullName',
    required: false,
    description: '供应商全称，可选',
    type: String,
  })
  fullName?: string

  @ApiProperty({
    name: 'contactPerson',
    required: false,
    description: '联系人，可选',
    type: String,
  })
  contactPerson?: string

  @ApiProperty({
    name: 'contactPhone',
    required: false,
    description: '联系电话，可选',
    type: String,
  })
  contactPhone?: string

  @ApiProperty({
    name: 'address',
    required: false,
    description: '联系地址，可选',
    type: String,
  })
  address?: string
}
export class CSupplierDto {
  @ApiProperty({
    name: 'code',
    required: false,
    description: '编码，忽略时自动生成',
    type: String,
  })
  code?: string

  @ApiProperty({
    name: 'shortName',
    required: true,
    description: '供应商简称，必填',
    type: String,
  })
  shortName: string

  @ApiProperty({
    name: 'fullName',
    required: false,
    description: '供应商全称，可选',
    type: String,
  })
  fullName?: string

  @ApiProperty({
    name: 'contactPerson',
    required: false,
    description: '联系人，可选',
    type: String,
  })
  contactPerson?: string

  @ApiProperty({
    name: 'contactPhone',
    required: false,
    description: '联系电话，可选',
    type: String,
  })
  contactPhone?: string

  @ApiProperty({
    name: 'address',
    required: false,
    description: '联系地址，可选',
    type: String,
  })
  address?: string

  @ApiProperty({ name: 'formData', required: false, description: '工单表单的数据（JSON格式）', type: String })
  formData: string
}

export class USupplierDto {
  @ApiProperty({
    name: 'code',
    required: false,
    description: '编码，忽略时自动生成',
    type: String,
  })
  code?: string

  @ApiProperty({
    name: 'shortName',
    required: true,
    description: '供应商简称，必填',
    type: String,
  })
  shortName: string

  @ApiProperty({
    name: 'fullName',
    required: false,
    description: '供应商全称，可选',
    type: String,
  })
  fullName?: string

  @ApiProperty({
    name: 'contactPerson',
    required: false,
    description: '联系人，可选',
    type: String,
  })
  contactPerson?: string

  @ApiProperty({
    name: 'contactPhone',
    required: false,
    description: '联系电话，可选',
    type: String,
  })
  contactPhone?: string

  @ApiProperty({
    name: 'address',
    required: false,
    description: '联系地址，可选',
    type: String,
  })
  address?: string

  @ApiProperty({ name: 'formData', required: false, description: '工单表单的数据（JSON格式）', type: String })
  formData: string
}
