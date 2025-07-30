import { AutoIncrement, BelongsTo, Column, CreatedAt, DataType, ForeignKey, HasMany, HasOne, Model, PrimaryKey, Table, UpdatedAt } from 'sequelize-typescript'
import { findPagination } from '@model/shared/method'
import { BaseDate } from '@model/shared/baseDate'
import { DynamicFormRule } from './dynamicFormRule.model'

/**动态表单主表 */
@Table({ tableName: `system_dynamic_form`, timestamps: false, freezeTableName: true, comment: '动态表单主表' })
export class DynamicForm extends BaseDate<DynamicForm> {
  @Column({ type: DataType.STRING, comment: '关联表名' })
  declare tableName: string

  @Column({ type: DataType.INTEGER, comment: '表单状态 1:启用 0:禁用', defaultValue: 1 })
  declare status: number

  @Column({ type: DataType.TEXT, comment: '备注' })
  declare remark: string

  // 关联关系
  @HasMany(() => DynamicFormRule, 'field')
  declare field: DynamicFormRule[]

  // methods
  // ------------------------------------------------
  static findPagination = findPagination
}