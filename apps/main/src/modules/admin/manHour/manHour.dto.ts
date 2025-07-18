import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { PaginationDto } from '@common/dto'
import { PERFORMANCE_CONFIG_TYPE, PERFORMANCE_CONFIG_UNIT } from '@common/enum'
import { Type } from 'class-transformer'
import { IsArrayLength } from '@library/utils/custom'

export class ManHourPageDto extends PaginationDto{

  @ApiProperty({ name: 'materialName', required: false, description: '产品名称', type: String })
  materialName: string

  @ApiProperty({ required: false, description: '工时类型', type: String,enum:PERFORMANCE_CONFIG_TYPE})
  type: PERFORMANCE_CONFIG_TYPE

}
export class CHourProcessDto {
  @ApiProperty({required: true, description: '工序Id', type: Number })
  @IsNumber({},{message:"工序Id必须是数字"})
  processId: number

  @ApiProperty({required: true, description: '工时', type: Number })
  @Min(0,{message:"工时最小为0"})
  @IsNumber({},{message:"工时必须是数字"})
  canonNum: number

  manHourId?:number

}

export class CManHourDto {
  @ApiProperty({required: false, description: '记录id 传id表示编辑', type: Number })
  @IsOptional()
  @IsNumber({},{message:"记录id必须是数字"})
  id?: number

  @ApiProperty({required: true, description: '物料Id', type: Number })
  @IsNumber({},{message:"物料Id必须是数字"})
  materialId?: number

  @ApiProperty({required: true, description: '开始日期', type: Date })
  @IsNotEmpty({message:"开始日期不能为空"})
  startDate: string|number

  @ApiProperty({required: false, description: '备注', type: String })
  @IsOptional()
  @IsString({message:"备注必须是字符串"})
  desc?: string

  @ApiProperty({required: true, description: '单位', type: String,enum:PERFORMANCE_CONFIG_UNIT })
  @IsEnum(PERFORMANCE_CONFIG_UNIT,{message:"单位错误"})
  unit: PERFORMANCE_CONFIG_UNIT

  @ApiProperty({required: true, description: '工时类型', type: String,enum:PERFORMANCE_CONFIG_TYPE })
  @IsEnum(PERFORMANCE_CONFIG_TYPE,{message:"工时类型错误"})
  type: PERFORMANCE_CONFIG_TYPE

  @ApiProperty({required: true, description: '工序收入配置项', type: CHourProcessDto })
  @Type(()=>CHourProcessDto)
  @ValidateNested({ each: true })
  @IsArrayLength({min:1},{message:"工序收入配置项必须是数组且长度大于0"})
  processList: CHourProcessDto[]

  declare createById?:number
  declare code?:string

}
//批量添加
export class CBatchManHourDto {
  @ApiProperty({required: true, description: '配置项', type: [CManHourDto] })
  @Type(()=>CManHourDto)
  @ValidateNested({ each: true })
  @IsArrayLength({min:1},{message:"配置项必须是数组且长度大于0"})
  list: CManHourDto[]

}
