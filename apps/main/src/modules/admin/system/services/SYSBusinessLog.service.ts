import { Pagination } from '@common/interface';
import { RedisProvider } from '@library/redis';
import { InjectModel } from '@nestjs/sequelize';
import { HttpException, Inject, Injectable } from '@nestjs/common';
import _ = require('lodash');
import { CSYSBusinessLogDto, FindPaginationDto } from '../dtos/SYSBusinessLog.dto';
import { SYSBusinessLog } from '@model/sys/SYSBusinessLog.model';
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { Paging } from '@library/utils/paging'
import { FileList } from '@model/dm/FileList.model'

@Injectable()
export class SYSBusinessLogService {
	constructor(

		@InjectModel(SYSBusinessLog)
		private SYSBusinessLogModel: typeof SYSBusinessLog,

	) { }

	public async create(dto: CSYSBusinessLogDto, loadModel) {
		const result = await SYSBusinessLog.create(dto);
		return result;
	}



	public async delete(id: number, loadModel) {
		const result = await SYSBusinessLog.destroy({
			where: {
				id: id,
			},
		});
		return result;
	}

	public async find(id: number, loadModel) {
		const options: FindOptions = { where: { id }, include: [{ all: true }] };
		const result = await SYSBusinessLog.findOne(options);
		return result;
	}

	public async findPagination(dto: FindPaginationDto, pagination: Pagination, loadModel) {
		const options: FindPaginationOptions = {
			where: {},
			pagination,
			include: [
				{
					association: 'user',
					attributes: ['id', 'name']
				}
			]
		};
		if (dto.module) {
			options.where['module'] = {
				[Op.eq]: dto.module,
			};
		}
		const result = await Paging.diyPaging(SYSBusinessLog, pagination, options);
		return result;
	}
}
