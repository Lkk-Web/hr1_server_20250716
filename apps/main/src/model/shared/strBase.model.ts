import { findPagination } from './method'

import {
  BeforeCount,
  BeforeCreate,
  BeforeFind,
  BeforeSave,
  Column,
  DataType,
  Model,
  PrimaryKey,
} from 'sequelize-typescript'

// import { RequestContext } from '@library/utils/requestContext'

export class StrBaseModel<T> extends Model<T> {
  @PrimaryKey
  @Column(DataType.STRING)
  declare id: string;

  // methods
  // ------------------------------------------------
  static findPagination = findPagination;

  // hooks 组织机构数据隔离
  // ------------------------------------------------

  // 查找前钩子
  // @BeforeCount
  // @BeforeFind
  // static tenantFindHook(options) {
  //   if (!options) {
  //     options = {};
  //   }
  //   // 是否忽略组织机构数据隔离
  //   if (options['ignoreOrgCode']) {
  //     return options;
  //   }
  //   if (options.where && options.where['orgCode']) {
  //     return options;
  //   }
  //   // 获取上下文，如果没有代表没有登录
  //   const currentRequest = RequestContext.currentRequest();
  //   if (!currentRequest) {
  //     return options;
  //   }
  //   const user = RequestContext.currentUser();
  //   // 查询用户有的角色，获取角色最高的数据权限（目前只有两种权限，全部数据及组织数据）
  //   if (!user) {
  //     return options;
  //   }
  //   // if (dataScopeType == 0) {
  //   // 	return options;
  //   // }
  //   const dataScopeType = currentRequest['dataScopeType'];
  //   if (dataScopeType == 0) {
  //     return options;
  //   }
  //   let orgCode = currentRequest['orgCode'];
  //   if (dataScopeType == 1 || dataScopeType == 2) {
  //     orgCode = currentRequest['roleOrg'];
  //   }
  //   if (!orgCode) {
  //     return options;
  //   }
  //   if (!options.where) {
  //     options.where = {};
  //   }
  //   // 判断是否有orgCode字段，如果没有则不添加
  //   // 获取当前模型类的所有字段名称
  //   // @ts-ignore
  //   const attributes = this.prototype.rawAttributes;
  //   const fieldNames = Object.keys(attributes);
  //   if (fieldNames.includes('orgCode') && !options.where['orgCode']) {
  //     options.where['orgCode'] = orgCode;
  //   }
  //   return options;
  // }

  // // 创建前钩子
  // @BeforeSave
  // @BeforeCreate
  // static tenantCreateHook(instance, options) {
  //   if (options && options['ignoreOrgCode']) {
  //     return instance;
  //   }
  //   const currentRequest = RequestContext.currentRequest();
  //   if (!currentRequest) {
  //     return instance;
  //   }
  //   const orgCode = currentRequest['orgCode'];
  //   // const user = RequestContext.currentUser();
  //   // let roles = user.roleList
  //   // let dataScopeType = '1'
  //   // for (let role of roles) {
  //   // 	if (role.dataScopeType == '0') {
  //   // 		dataScopeType = '0'
  //   // 		break
  //   // 	}
  //   // }
  //   // if (!orgCode || (user && dataScopeType == '0')) {
  //   // 	return instance;
  //   // }
  //   // 判断是否有orgCode字段，如果没有则不添加
  //   // @ts-ignore
  //   const attributes = this.prototype.rawAttributes;
  //   if (!attributes['orgCode']) {
  //     return instance;
  //   }
  //   if (!instance['orgCode']) {
  //     instance['orgCode'] = orgCode;
  //   }
  //   return instance;
  // }
}
