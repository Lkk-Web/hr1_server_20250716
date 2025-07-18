import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/sys/user.model'
import { WorkShop } from '@model/base/workShop.model'
/** 仓库 */
@Table({ tableName: `wm_warehouse`, freezeTableName: true, timestamps: true, comment: '仓库表' })
export class Warehouse extends BaseDate<Warehouse> {
  // 仓库名称：必填
  @Column({
    comment: '仓库名称',
    type: DataType.STRING(128),
    allowNull: false, // 必填
  })
  declare name: string

  // 仓库属性
  @Column({
    comment: '仓库属性',
    type: DataType.STRING(255),
    allowNull: false, //必填
  })
  declare type: string

  // 状态
  @Column({
    comment: '状态',
    type: DataType.BOOLEAN,
    allowNull: false, // 必填
  })
  declare status: boolean

  @Column({
    comment: '备注',
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remark: string
}
