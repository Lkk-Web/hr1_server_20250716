import * as crypto from 'crypto';
// import { pinyin } from 'pinyin-pro';
import { or } from 'sequelize';
/**
 * 字符串操作公用组件
 */
export class STRUtil {
	/**
	 * 根据传入的长度生成对应长度的对应随机字符串
	 */
	static generateRandomString(length: number): string {
		const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		let randomString = '';

		for (let i = 0; i < length; i++) {
			const randomIndex = crypto.randomInt(0, charset.length);
			randomString += charset.charAt(randomIndex);
		}

		return randomString;
	}
	/**
	 * 将中文字符串转换为每个字的拼音首字母大写的字符串
	 * @param {string} chineseStr - 需要转换的中文字符串
	 * @return {string} 转换后的每个字的拼音首字母大写的字符串
	 */
	// static convertToPinyinInitials(chineseStr: string) {
	// 	// 使用 pinyin-pro 获取完整拼音，然后转换为首字母大写
	// 	return pinyin(chineseStr, {
	// 		toneType: 'none', // 不包含声调
	// 		type: 'array', // 输出类型为数组，每个中文字符的拼音
	// 		pattern: 'initial', // 仅获取拼音首字母
	// 	})
	// 		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
	// 		.join(''); // 将每个字的首字母大写并拼接成字符串
	// }
	/**
	* 递归处理菜单
	* @menus []- 需要转换的菜单
	* @parentId int 父目录的id，首层不传
	* @added 数组，用于去重
	*/
	static buildMenuTree(menus, parentId = null, added = new Set()) {
		return menus
			.filter(menu => menu.parentId === parentId && !added.has(menu.id))
			.sort((a, b) => a.sort - b.sort)
			.map(menu => {
				added.add(menu.id); // 标记当前菜单项已添加
				return {
					...menu,
					children: this.buildMenuTree(menus, menu.id, added)
				};
			});
	}

	/**
	* 递归处理组织
	* @orgs []- 需要转换的组织
	* @id int 自己组织的id
	* @types 类型，1为最上层组织，2为部门及子部门数据
	*/
	static buildOrgsTree(orgs: any, id, types: number) {
		if (types == 1) {
			// 递归处理部门往上查找父级获取本层级最上层的父级，parentId为null的组织id
			id = this.findTopParent(id, orgs)
		}
		const childCodes = [];
		function traverse(id: number, orgs: any): void {
			if (childCodes.length == 0) {
				for (let org of orgs) {
					if (org.id == id) {
						childCodes.push(org.code);
					}
				}
			}
			const children = orgs.filter(org => org.parentId === id);
			if (children.length === 0) {
				return;
			}
			children.forEach(child => {
				childCodes.push(child.code);
				traverse(child.id, orgs);
			});
		}
		traverse(id, orgs);
		return childCodes;
	}

	static findTopParent(id: number, orgs: any): number | null {
		function traverse(id: number, orgs: any): number | null {
			const organization = orgs.find(org => org.id === id);
			if (!organization) {
				return null;
			}
			if (organization.parentId === null) {
				return id;
			}
			return traverse(organization.parentId, orgs);
		}
		return traverse(id, orgs);
	}


	static findTopParentName(id: number, orgs: any): string | null {
		let name = ''
		function traverse(id: number, orgs: any): string | null {
			const organization = orgs.find(org => org.dataValues.id === id);
			if (!organization) {
				return null;
			}
			if (name == '') {
				name = organization.name
			} else {
				name = organization.name + '/' + name
			}
			if (organization.parentId === null) {
				return name;
			}
			return traverse(organization.parentId, orgs);
		}
		return traverse(id, orgs);

	}

}
