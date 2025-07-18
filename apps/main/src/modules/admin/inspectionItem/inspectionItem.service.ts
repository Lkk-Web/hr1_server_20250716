import { Redis } from 'ioredis';
import { Pagination } from '@common/interface';
import { RedisProvider } from '@library/redis';
import { InjectModel } from '@nestjs/sequelize';
import { HttpException, Inject, Injectable } from '@nestjs/common';
import _ = require('lodash');
import { CInspectionItemDTO, FindPaginationDto, UInspectionItemDTO } from './inspectionItem.dto'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { Sequelize } from 'sequelize-typescript'
import { InspectionItem } from '@model/qm/inspectionItem.model'
import { Paging } from '@library/utils/paging'

@Injectable()
export class InspectionItemService {
	constructor(
		@Inject(RedisProvider.local)
		private readonly redis: Redis,

		@InjectModel(InspectionItem)
		private inspectionItemModel: typeof InspectionItem,
		private sequelize: Sequelize,
	) { }

	public async create(dto: CInspectionItemDTO, loadModel, user) {
		const temp = await InspectionItem.findOne({ where: { name: dto.name } })
		if (temp) throw new HttpException('已有相同名称检验项次存在', 400)
		const result = await InspectionItem.create({ ...dto, createdUserId: user.id, updatedUserId: user.id })
		return result;
	}


	public async edit(dto: UInspectionItemDTO, id: number, loadModel, user) {
		let inspectionItem = await InspectionItem.findOne({ where: { id } });
		if (!inspectionItem) {
			throw new HttpException('数据不存在', 400006);
		}
		const temp = await InspectionItem.findOne({ where: { name: dto.name, id: { [Op.ne]: id } } })
		if (temp) throw new HttpException('已有相同名称检验项次存在', 400)
		await inspectionItem.update({ ...dto, updatedUserId: user.id });
		inspectionItem = await InspectionItem.findOne({ where: { id } });
		return inspectionItem;
	}

	public async delete(id: number, loadModel) {
		const result = await InspectionItem.destroy({
			where: {
				id: id,
			},
		});
		return result;
	}

	public async find(id: number, loadModel) {
		const options: FindOptions = {
			where: { id },
			include: [
				{
					association: 'createdUser',
					attributes: ['id', 'userName'],
					required: false,
				},
				{
					association: 'updatedUser',
					attributes: ['id', 'userName'],
					required: false,
				},
			]
		};
		const result = await InspectionItem.findOne(options);
		return result;
	}

	public async findPagination(dto: FindPaginationDto, pagination: Pagination, loadModel) {
		const options: FindPaginationOptions = {
			where: {},
			pagination,
			include: [
				{
					association: 'createdUser',
					attributes: ['id', 'userName'],
					required: false,
				},
				{
					association: 'updatedUser',
					attributes: ['id', 'userName'],
					required: false,
				},
			]
		};
		if (dto.name) {
			options.where['name'] = {
				[Op.like]: `%${dto.name}%`,
			}
		}
		if (dto.type) {
			options.where['type'] = {
				[Op.like]: `%${dto.type}%`
			}
		}
		if (dto.status) {
			const statusString = String(dto.status).toLowerCase().trim() // 确保字符串统一处理
			const statusBoolean = statusString === 'true' || statusString === '1' // 转换逻辑
			options.where['status'] = {
				[Op.eq]: statusBoolean,
			}
		}

		if (dto.filterIds) {
			options.where['id'] = {
				[Op.notIn]: dto.filterIds
			}
		}
		const result = await Paging.diyPaging(InspectionItem, pagination, options)
		return result;
	}
}
