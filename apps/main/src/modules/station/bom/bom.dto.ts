import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class materialListDto {
  @ApiProperty({
    description: '工序任务单id',
    type: Number,
    required: true,
  })
  serialId: string
}

export class QDrawingDto {
  @ApiProperty({ description: '图号', type: String, required: true })
  @IsString({ message: '图号必须为字符串' })
  code: string

  @ApiProperty({ description: '文件类型', type: String, required: true, enum: ['pdf', 'dwg', 'sldasm', 'sldprt'] })
  @IsString({ message: '文件类型必须为字符串' })
  fileType: string
}
