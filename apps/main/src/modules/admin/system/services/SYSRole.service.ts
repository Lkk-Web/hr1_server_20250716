import { Pagination } from '@common/interface';
import { InjectModel } from '@nestjs/sequelize';
import { HttpException, Injectable } from '@nestjs/common';
import { SYSRole } from '@model/sys/SYSRole.model';
import { CSYSRoleDto, ESYSRoleDto, FindPaginationDto } from '../dtos/SYSRole.dto';
import { ESYSRoleMenuPowerDto } from '../dtos/SYSRoleMenu.dto';
import { SYSRoleMenu } from '@model/sys/SYSRoleMenu.model';
import { DATA_SCOPE_TYPE, SYS_MODULE, USER_TYPE } from '@common/constant';
import { SYSBusinessLog } from '@model/sys/SYSBusinessLog.model';
import { FindOptions, Op, where } from 'sequelize'
import { SYSMenu } from '@model/sys/SYSMenu.model';
import { SYSOrg, SYSRoleOrg, User } from '@model/index'
import { FindPaginationOptions } from '@model/shared/interface'
import { Aide, JsExclKey } from '@library/utils/aide'
import { trim } from 'lodash'
import { Paging } from '@library/utils/paging'

@Injectable()
export class SysRoleService {
	constructor(
		@InjectModel(SYSRole)
		private SYSRoleModel: typeof SYSRole,

	) { }

	public async create(dto: CSYSRoleDto, user: User, ip: string, loadModel) {
		let sysRole = await SYSRole.findOne({ where: { name: dto.name } });
		if (sysRole) {
			throw new HttpException('该角色已存在', 400);
		}
		// const last = await SYSRole.findOne({
		// 	order: [['id', 'DESC']],
		// });
		// dto['code'] = String(parseInt(last.code, 10) + 1).padStart(4, '0');
		let menuList = []
		if (dto.menus) {
			menuList = dto.menus
		}
		delete dto.menus
		let orgList = []
		if (dto.dataScopeType == '4') {
			orgList = dto.orgs
		}
		delete dto.orgs
		const result = await SYSRole.create(dto);
		// await SYSBusinessLog.create({
		// 	description: '创建角色',
		// 	params: `${dto.name}`,
		// 	userId: user.id,
		// 	module: SYS_MODULE.ROLE,
		// });
		if (menuList.length > 0) {
			await SYSRoleMenu.bulkCreate(menuList.map(item => ({ roleId: result.id, menuId: item })));
		}
		if (orgList.length > 0) {
			await SYSRoleOrg.bulkCreate(orgList.map(item => ({ roleId: result.id, orgId: item })));
		}
		// await SYSBusinessLog.create({module:'角色管理',ip,userId:user.id,behavioral:'新增',description:user.name+'新增了角色',params:''+dto})
		return result;
	}

	public async edit(dto: ESYSRoleDto, id: number, user: User, ip: string, loadModel) {
		let sysRole = await SYSRole.findOne({ where: { id } });
		if (!sysRole) {
			throw new HttpException('角色不存在', 400);
		}
		if (dto.menus) {
			await SYSRoleMenu.destroy({ where: { roleId: id }, force: true })
			let menuList = dto.menus
			await SYSRoleMenu.bulkCreate(menuList.map(item => ({ roleId: id, menuId: item })));
			delete dto.menus
		}
		if (dto.orgs) {
			await SYSRoleOrg.destroy({ where: { roleId: id } })
			let orgList = dto.orgs
			await SYSRoleOrg.bulkCreate(orgList.map(item => ({ roleId: id, orgId: item })));
			delete dto.orgs
		}
		await sysRole.update(dto);

		// await SYSBusinessLog.create({
		// 	description: '修改角色',
		// 	params: `${id}`,
		// 	userId: user.id,
		// 	module: SYS_MODULE.ROLE,
		// });
		sysRole = await SYSRole.findOne({ where: { id } });
		// await SYSBusinessLog.create({module:'角色管理',ip,userId:user.id,behavioral:'修改',description:user.name+'编辑了角色'+id,params:''+dto})
		return sysRole;
	}

	// public async editPower(dto: ESYSRolePowerDto, id: number) {
	// 	let SYSRoleMenu = await SYSRole.findOne({ where: { id } });
	// 	if (!SYSRoleMenu) {
	// 		throw new HttpException('数据不存在', 400);
	// 	}
	// 	await SYSRoleMenu.update(dto);
	// 	SYSRoleMenu = await SYSRole.findOne({ where: { id } });
	// 	return SYSRoleMenu;
	// }

	public async delete(id: number, user: User, ip: string, loadModel) {
		// const count = await User.count({ where: { roleId: id } });
		// if (count > 0) {
		// 	throw new HttpException('该角色有用户正在使用!', 400);
		// }
		const result = await SYSRole.destroy({
			where: {
				id: id,
			},
		});
		// await SYSBusinessLog.create({module:'角色管理',ip,userId:user.id,behavioral:'删除',description:user.name+'删除了角色',params:''+id})
		return result;
	}

	public async find(id: number, loadModel) {
		const options: FindOptions = {
			where: { id },
			include: [{ all: true }],
		};
		const result = await SYSRole.findOne(options);
		return result;
	}

	public async findPagination(dto: FindPaginationDto, pagination: Pagination, loadModel) {
		const options: FindPaginationOptions = {
			where: {},
			include: [{
				association: 'menuList',
				attributes: ['id', 'name', 'parentId', 'url', 'perms', 'sort', 'status', 'types'],
				required: false,
			}, {
				association: 'orgList',
				attributes: ['id', 'name', 'parentId', 'sort', 'code'],
				where: { status: 1 },
				required: false,
			}],
			pagination,
		};
		if (dto.name) {
			options.where['name'] = {
				[Op.like]: `%${dto.name}%`,
			};
		}
		if (dto.status) {
			const statusString = String(dto.status).toLowerCase().trim(); // 确保字符串统一处理
			const statusBoolean = (statusString === 'true' || statusString === '1'); // 转换逻辑
			options.where['status'] = {
				[Op.eq]: statusBoolean
			};
		}
		const result = await Paging.diyPaging(SYSRole, pagination, options);
		for (const res of result.data) {
			const temp = await SYSRoleMenu.findOne({ where: { roleId: res.id } });
			if (temp != null) {
				res.setDataValue('type', '已配置');
			} else {
				res.setDataValue('type', '未配置');
			}
		}
		return result;
	}

	public async editRoleMenuPower(dtos: ESYSRoleMenuPowerDto, roleId: number, user: User, loadModel) {
		if (!roleId) throw new HttpException('请携带角色ID修改权限', 400);
		if (!(await SYSRole.findByPk(roleId))) throw new HttpException('未查询到该角色', 400);
		let res = false;
		// 先将角色操作权限全下了 再根据传过来的code判断哪个勾选上
		// await SYSRoleMenuAction.update({ status: 0 }, { where: { roleId: roleId } })
		for (const dto of dtos.arr) {
			//权限选择自定义
			if (dto.dataScopeType === DATA_SCOPE_TYPE.CUSTOM) {
				const roleMenus = await SYSRoleMenu.findAll({
					where: {
						menuId: dto.menuId,
						roleId: roleId,
					},
				});
			}
			// await SYSMenuAction.update(
			// 	{ status: dto.status },
			// 	{
			// 		where: {
			// 			menuId: dto.menuId,
			// 			code: dto.code,
			// 		},
			// 	},
			// );
			// 如果传过来的操作菜单编号有值则将其在RoleMenuAction中的状态改为1
			// if (dto.code.length) {
			// 	for (const str of dto.code) {
			// 		const temp = await SYSMenuAction.findOne({ where: { menuId: dto.menuId, code: str } })
			// 		await SYSRoleMenuAction.update({ status: 1 }, { where: { menuActionId: temp.id, roleId: roleId } })
			// 	}
			// } else {
			// 	const list = await SYSMenuAction.findAll({ where: { menuId: dto.menuId } })
			// 	for (const sysMenuAction of list) {
			// 		await SYSRoleMenuAction.update({ status: 0 }, { where: { menuActionId: sysMenuAction.id, roleId: roleId } })
			// 	}
			// }

			// if (dto.menuId) {
			// 	await SYSRoleMenu.update(
			// 		{ status: 1 },
			// 		{
			// 			where: {
			// 				menuId: dto.menuId,
			// 				roleId: roleId,
			// 			},
			// 		},
			// 	);
			// } else {
			// 	await SYSRoleMenu.update(
			// 		{ status: 0 },
			// 		{
			// 			where: {
			// 				menuId: dto.menuId,
			// 				roleId: roleId,
			// 			},
			// 		},
			// 	);
			// }
			// await SYSRoleMenu.update(
			// 	{ dataScopeType: dto.dataScopeType },
			// 	{
			// 		where: {
			// 			menuId: dto.menuId,
			// 			roleId: roleId,
			// 		},
			// 	},
			// );
		}
		res = true;
		// await SYSBusinessLog.create({
		// 	description: '修改角色权限',
		// 	params: `${roleId}`,
		// 	userId: user.id,
		// 	module: SYS_MODULE.ROLE,
		// });
		return res;
	}

	public async importExcel(buffer: Buffer, loadModel) {
		const mapper: JsExclKey[] = [
			{
				keyName: '角色名称', // Excel列的名称
				key: 'roleName',         // 物料Model类中的属性名
			},
			{
				keyName: '备注',
				key: 'phone',
			},
		]
		let result = {}
		let roleSuccess = 0
		let roleUpdate = 0
		let roleFailed = 0
		let total = 0
		let errors: Array<string> = []

		// 将当前Sheet的数据转换为JSON
		const json = await Aide.excelToJson(buffer, mapper)
		// 遍历每行数据并保存到数据库
		for (const rowElement of json.row) {
			if (rowElement.roleName) {
				const role = await SYSRole.findOne({ where: { name: trim(rowElement.roleName) } })
				if (!role) {
					await SYSRole.create({ name: trim(rowElement.roleName), status: 1, remark: trim(rowElement.remark) })
					roleSuccess++;
				} else {
					roleFailed++
				}
			}
			total++
		}
		result = { total, success: roleSuccess, update: roleUpdate, failed: roleFailed }
		return result
	}
}
