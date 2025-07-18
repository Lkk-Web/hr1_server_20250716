import { ApiProperty } from '@nestjs/swagger'

export class FindPaginationDto {
  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string
  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string

  @ApiProperty({ type: String, description: '工单编码', required: false })
  selectAttr: string

  @ApiProperty({ type: String, description: '状态 (未开始, 执行中, 已暂停, 已取消,未完成,已完成)', required: false, })
  status: string

  @ApiProperty({ type: Boolean, description: '是否仅展示本部门', required: false })
  isDept: boolean

  @ApiProperty({
    required: false,
    description: '物料类别',
    type: String,
  })
  category: string


}
