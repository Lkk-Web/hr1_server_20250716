import { ApiProperty } from '@nestjs/swagger'

export class FindPaginationDto {
  @ApiProperty({
    required: false,
    description: '托盘编号',
    type: String,
  })
  pallet_code?: string

  @ApiProperty({
    required: false,
    description: '托盘规格',
    type: String,
  })
  pallet_spec?: string

  @ApiProperty({
    required: false,
    description: '班组ID',
    type: Number,
  })
  teamId?: number

  @ApiProperty({
    required: false,
    description: '状态',
    type: Boolean,
  })
  status?: boolean
}

export class CPalletDto {
  @ApiProperty({
    name: 'teamId',
    required: true,
    description: '班组ID，必填项',
    type: Number,
  })
  teamId: number

  @ApiProperty({
    name: 'pallet_code',
    description: '托盘编号',
    type: String,
  })
  pallet_code: string

  @ApiProperty({
    name: 'pallet_spec',
    description: '托盘规格',
    type: String,
  })
  pallet_spec: string
}

export class UPalletDto {
  @ApiProperty({
    name: 'teamId',
    required: false,
    description: '班组ID',
    type: Number,
  })
  teamId?: number

  @ApiProperty({
    name: 'pallet_code',
    required: false,
    description: '托盘编号',
    type: String,
  })
  pallet_code?: string

  @ApiProperty({
    name: 'pallet_spec',
    required: false,
    description: '托盘规格',
    type: String,
  })
  pallet_spec?: string

  @ApiProperty({
    name: 'status',
    required: false,
    description: '状态（启用/禁用）',
    type: Boolean,
  })
  status?: boolean
}
