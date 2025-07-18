import { ApiProperty } from '@nestjs/swagger'
import { PaginationDto } from '@common/dto'
import { NOTIFY_SCENE } from '@common/enum'

export class NotifyPageDto extends PaginationDto{
  @ApiProperty({ required: false, description: '状态 0：未读 1：已读 默认全部', type: Number,enum:[0,1] })
  status: number

  @ApiProperty({ required: false, description: '创建时间', type: Date,example:"2025-3-01" })
  createdAt: string

  @ApiProperty({ required: false, description: '单据编号', type: String})
  code: string

  @ApiProperty({ required: false, description: '名称', type: String})
  name: string

  @ApiProperty({ required: false, description: '场景', type: String,enum:NOTIFY_SCENE})
  scene: string

  teamId?:number
}
