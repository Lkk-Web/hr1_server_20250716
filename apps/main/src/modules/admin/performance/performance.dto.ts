import { PaginationDto } from '@common/dto'
import { ApiProperty } from '@nestjs/swagger'
import { Dayjs } from 'dayjs'
import { IsNotEmpty } from 'class-validator'

export class PerformanceListDto{

	@ApiProperty({ required: false, description: '班组名称', type: String })
	teamName: string

	@ApiProperty({ required: false, description: '员工名称', type: String })
	userName: string

	@ApiProperty({ type: Number, required: false, description: '是否为外包',enum:[0,1] })
	isOut?: number

	@ApiProperty({ type: Date, required: false, description: '开始时间', })
	startTime?: string | number | Date | Dayjs;

	@ApiProperty({ type: Date, required: false, description: '结束时间', })
	endTime?: string | number | Date | Dayjs;

}

export class PerformanceDetailDto extends PaginationDto{

	@ApiProperty({ required: true, description: '班组id', type: Number })
	@IsNotEmpty({ message: '班组id不能为空' })
	teamId: number|number[]

	@ApiProperty({ required: false, description: '员工名称', type: String })
	userName?: string

	@ApiProperty({ type: Date, required: false, description: '开始时间', })
	startTime?: string | number | Date | Dayjs;

	@ApiProperty({ type: Date, required: false, description: '结束时间', })
	endTime?: string | number | Date | Dayjs;

}

export class PerformanceListRes{
	@ApiProperty({ required: true, description: '班组id', type: Number })
	teamId: number

	@ApiProperty({ required: true, description: '班组名称', type: String })
	name: string

	@ApiProperty({ required: true, description: '良品数', type: Number })
	goodCount: number

	@ApiProperty({ required: true, description: '良品率', type: Number })
	goodPr: number

	@ApiProperty({ required: true, description: '工时 单位/s', type: Number })
	duration: number
}
