import { AutoIncrement, BelongsTo, Column, CreatedAt, DataType, ForeignKey, HasMany, HasOne, Model, PrimaryKey, Table, UpdatedAt } from 'sequelize-typescript'
import { findPagination } from '@model/shared/method'
import { BaseDate } from '@model/shared/baseDate'
import { DynamicFormRule } from './dynamicFormRule.model'
import { DynamicForm } from './dynamicForm.model'

/**动态表单数据表 */
@Table({ tableName: `system_dynamic_form_data`, timestamps: false, freezeTableName: true, comment: '动态表单数据表' })
export class DynamicFormData extends BaseDate<DynamicFormData> {
  @ForeignKey(()=> DynamicForm)
  @Column({ type: DataType.INTEGER, comment: '表单ID' })
  declare formId: number

  @Column({ type: DataType.STRING, comment: '表单实例ID(业务主键)' })
  declare instanceId: string

  @ForeignKey(()=> DynamicFormRule)
  @Column({ type: DataType.INTEGER, comment: '字段ID' })
  declare fieldId: number

  @Column({ type: DataType.STRING, comment: '字段名称' })
  declare fieldName: string

  @Column({ type: DataType.TEXT, comment: '字段值' })
  declare fieldValue: string

  @Column({ type: DataType.STRING, comment: '字段类型' })
  declare fieldType: string

  @Column({ type: DataType.STRING, comment: '关联业务表名' })
  declare businessTable: string

  @Column({ type: DataType.INTEGER, comment: '关联业务记录ID' })
  declare businessId: number

  @Column({ type: DataType.STRING, comment: '提交人' })
  declare submittedBy: string

  @Column({ type: DataType.DATE, comment: '提交时间' })
  declare submittedAt: Date

  @Column({ type: DataType.STRING, comment: '审核人' })
  declare approvedBy: string

  @Column({ type: DataType.DATE, comment: '审核时间' })
  declare approvedAt: Date

  @Column({ type: DataType.TEXT, comment: '审核意见' })
  declare approveRemark: string

  @Column({ type: DataType.STRING, comment: '创建人' })
  declare createdBy: string

  @Column({ type: DataType.STRING, comment: '更新人' })
  declare updatedBy: string

  @Column({ type: DataType.TEXT, comment: '备注' })
  declare remark: string

  // 关联关系
  @BelongsTo(() => DynamicForm, 'formId')
  declare form: any

  @BelongsTo(() => DynamicFormRule, 'fieldId')
  declare field: any

  // methods
  // ------------------------------------------------
  static findPagination = findPagination
}
