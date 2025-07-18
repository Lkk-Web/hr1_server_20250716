import { Pagination } from '@common/interface'
import { HttpException, Injectable } from '@nestjs/common'
import { CMaintenanceOrderDto, FindPaginationDto, UMaintenanceOrderDto } from './maintenanceOrder.dto'
import { MaintenanceOrder } from '@model/em/maintenanceOrder.model'
import { FindOptions, Op } from 'sequelize'
import { EquipmentLedger } from '@model/em/equipmentLedger.model'
import { MaintenanceOrderDetail } from '@model/em/maintenanceOrderDetail.model'
import { FindPaginationOptions } from '@model/shared/interface'
import { Paging } from '@library/utils/paging'
import { CheckOrderListDto } from '@modules/admin/checkOrder/checkOrder.dto'
import { Aide, getTime } from '@library/utils/aide'

@Injectable()
export class MaintenanceOrderService {
	constructor(
	) { }

	public async create(dto: CMaintenanceOrderDto, user, loadModel) {
		if (dto.code) {
			const temp = await MaintenanceOrder.findOne({ where: { code: dto.code } })
			if (temp) throw new HttpException('已存在相同编号的入库单', 400)
		} else {
			const date = new Date()
			const year = date.getFullYear().toString().substring(2)
			const month = date.getMonth().toString().padStart(2, '0')
			const temp = await MaintenanceOrder.findOne({
				order: [['id', 'DESC']],
				where: { code: { [Op.like]: `BY${year}${month}%` } },
			})
			if (temp) {
				const oldNO = temp.code
				const lastFourChars = oldNO.length >= 4 ? oldNO.slice(-4) : '0'.repeat(4 - oldNO.length) + oldNO
				let num = parseInt(lastFourChars)
				num++
				let newNO = num.toString().padStart(4, '0')

				dto.code = 'BY' + year + month + newNO
			} else {
				dto.code = 'BY' + year + month + '0001'
			}
		}
		const result = await MaintenanceOrder.create({
			code: dto.code,
			equipmentLedgerId: dto.equipmentLedgerId,
			maintenanceAt: dto.maintenanceAt,
			maintenanceUserId: dto.maintenanceUserId,
			nextAt: dto.nextAt,
			result: dto.result,
			createdUserId: user?.id,
			updatedUserId: user?.id,
		});
		if (dto.details) {
			for (const detail of dto.details) {
				await MaintenanceOrderDetail.create({ maintenanceOrderId: result.id, ...detail })
			}
		}
		return result;
	}


	public async edit(dto: UMaintenanceOrderDto, id: number, user, loadModel) {
		let maintenanceOrder = await MaintenanceOrder.findOne({ where: { id } });
		if (!maintenanceOrder) {
			throw new HttpException('数据不存在', 400006);
		}
		await MaintenanceOrderDetail.destroy({ where: { maintenanceOrderId: id } })
		await maintenanceOrder.update({
			equipmentLedgerId: dto.equipmentLedgerId,
			maintenanceAt: dto.maintenanceAt,
			maintenanceUserId: dto.maintenanceUserId,
			result: dto.result,
			updatedUserId: user?.id,
		});
		if (dto.details) {
			for (const detail of dto.details) {
				await MaintenanceOrderDetail.create({ maintenanceOrderId: id, ...detail })
			}
		}
		maintenanceOrder = await MaintenanceOrder.findOne({ where: { id } });
		return maintenanceOrder;
	}

	public async delete(id: number, loadModel) {
		const result = await MaintenanceOrder.destroy({
			where: {
				id: id,
			},
		});
		return result;
	}

	public async find(id: number, loadModel) {
		const options: FindOptions = {
			where: { id }, include: [
				{
					association: "equipmentLedger",
					attributes: ['id', 'code', 'equipmentId', 'workShopId', 'installLocationId', 'inspectionPlanId', 'checkStandardId', 'maintenancePlanId'],
					where: {},
					include: [
						{
							association: "equipment",
							attributes: ['id', 'name'],
							where: {},
						},
						{
							association: "workShop",
							attributes: ['id', 'name'],
						},
						{
							association: 'installLocation',
							attributes: ['id', 'locate'],
						},
					]
				},
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
				{
					association: 'maintenanceUser',
					attributes: ['id', 'userName'],
					required: false,
				},
				{
					association: "details"
				}

			]
		};
		const result = await MaintenanceOrder.findOne(options);
		return result;
	}

	public async findPagination(dto: FindPaginationDto, pagination: Pagination, loadModel) {
		const options: FindPaginationOptions = {
			where: {},
			pagination,
			include: [
				{
					association: "equipmentLedger",
					attributes: ['id', 'code', 'equipmentId', 'workShopId', 'installLocationId', 'inspectionPlanId', 'checkStandardId', 'maintenancePlanId'],
					where: {},
					include: [
						{
							association: "equipment",
							attributes: ['id', 'name'],
							where: {},
						},
						{
							association: "workShop",
							attributes: ['id', 'name'],
						},
						{
							association: 'installLocation',
							attributes: ['id', 'locate'],
						},
						{
							association: "maintenancePlan",
							attributes: ['id', 'code', 'name', 'frequency']
						}
					]
				},
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
				{
					association: 'maintenanceUser',
					attributes: ['id', 'userName'],
					required: false,
				},
				{
					association: "details"
				}
			]
		};

		if (dto.orderCode) {
			options.where['code'] = {
				[Op.like]: `%${dto.orderCode}%`
			}
		}

		if (dto.name) {
			options.include[0].include[0].where['name'] = {
				[Op.like]: `%${dto.name}%`
			}
		}

		if (dto.code) {
			options.include[0].where['code'] = {
				[Op.like]: `%${dto.code}%`
			}
		}

		if (dto.maintenanceAt) {
			options.where['maintenanceAt'] = {
				[Op.eq]: dto.maintenanceAt
			}
		}

		if (dto.maintenanceUser) {
			options.include[3].where['name'] = {
				[Op.like]: `%${dto.maintenanceUser}%`
			}
		}


		const result = await Paging.diyPaging(MaintenanceOrder, pagination, options)
		return result;
	}

	//保养记录
	public async maintenanceLogs(dto:CheckOrderListDto) {
		let result = await EquipmentLedger.findOne({
			where:{id:dto.equipmentId},
			attributes:['id','code','spec'],
			include:[
				{association:'equipmentType',attributes:['name']},
				{association:'installLocation',attributes:['locate','status']},
				{association:'equipment',attributes:['name']},
			]
		});
		if(!result)Aide.throwException(400,"无效设备")
		const {startTime,endTime} = getTime({
			startTime:dto.date,
			endTime:dto.date
		},"M");
		const list = await MaintenanceOrder.findAll({
			where:{
				equipmentLedgerId:dto.equipmentId,
				maintenanceAt:{
					[Op.lte]:endTime.valueOf(),
					[Op.gte]:startTime.valueOf()
				}
			},
			attributes:['maintenanceAt','result'],
			include:[
				{association:'details',attributes:['name','method','type','val','bol']},
				{association:'createdUser',attributes:['userName']},
			]
		});
		const checkItem:{
			id:number,
			name:string,
			method:string,
		}[]=[];
		list.forEach(v=>{
			v.details.forEach(d=>{
				if(!checkItem.find(item=>item.name==d.name)){
					checkItem.push({id:checkItem.length+1,name:d.name,method:d.method})
				}
			})
		});
		result = result.toJSON();
		result['checkItem'] = checkItem;
		result['checkList'] = list.map(v=>{
			v = v.toJSON();
			v.details.forEach(vv=>{
				const temp = checkItem.find(item=>item.name==vv.name);
				delete vv.name;
				delete vv.method;
				vv.id = temp.id
			})
			return v;
		})

		return result;
	}
}
