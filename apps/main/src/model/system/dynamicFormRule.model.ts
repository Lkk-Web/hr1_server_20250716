import { AutoIncrement, BelongsTo, Column, CreatedAt, DataType, ForeignKey, HasMany, HasOne, Model, PrimaryKey, Table, UpdatedAt } from 'sequelize-typescript'
import { findPagination } from '@model/shared/method'
import { BaseDate } from '@model/shared/baseDate'
import { DynamicForm } from './dynamicForm.model'

// 字段类型枚举
enum FieldType {
  TEXT = 'text',
  NUMBER = 'number',
  SELECT = 'select',
  DATE = 'date',
  DATETIME = 'datetime',
  TEXTAREA = 'textarea',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  FILE = 'file',
  IMAGE = 'image',
  EMAIL = 'email',
  PASSWORD = 'password',
  URL = 'url',
  PHONE = 'phone',
  SWITCH = 'switch',
  SLIDER = 'slider',
  RATE = 'rate',
  COLOR = 'color',
}

/**动态表单字段明细表 */
@Table({ tableName: `system_dynamic_form_rule`, timestamps: false, freezeTableName: true, comment: '动态表单字段明细表' })
export class DynamicFormRule extends BaseDate<DynamicFormRule> {
  @ForeignKey(() => DynamicForm)
  @Column({ type: DataType.INTEGER, comment: '表单ID' })
  declare formId: number

  @Column({ type: DataType.STRING, comment: '字段名称' })
  declare fieldName: string

  @Column({ type: DataType.ENUM(...Object.values(FieldType)), comment: '字段类型' })
  declare fieldType: FieldType

  @Column({ type: DataType.STRING, comment: '数据库字段名（英文）' })
  declare dbFieldName: string

  @Column({ type: DataType.INTEGER, comment: '是否必填 1:是 0:否', defaultValue: 0 })
  declare isRequired: number

  @Column({
    type: DataType.TEXT,
    comment:
      '验证规则JSON,' +
      JSON.stringify({
        rules: [
          { type: 'required', message: '该字段不能为空' },
          { type: 'regex', pattern: '^1[3-9]\\d{9}$', message: '请输入合法手机号' },
          { type: 'minLength', value: 6, message: '最少6个字符' },
          { type: 'maxLength', value: 20, message: '最多20个字符' },
        ],
      }),
  })
  declare validationRules: string

  @Column({ type: DataType.TEXT, comment: '选项配置JSON(用于select/radio/checkbox等)' })
  declare optionsConfig: string

  @Column({ type: DataType.TEXT, comment: '默认值' })
  declare defaultValue: string

  @Column({ type: DataType.INTEGER, comment: '是否显示 1:是 0:否', defaultValue: 1 })
  declare isVisible: number

  @Column({ type: DataType.INTEGER, comment: '列宽度(栅格系统1-24)' })
  declare colSpan: number

  @Column({ type: DataType.INTEGER, comment: '排序号', defaultValue: 0 })
  declare sortOrder: number

  @Column({ type: DataType.STRING, comment: '帮助文本' })
  declare helpText: string

  @Column({ type: DataType.INTEGER, comment: '字段状态 1:启用 0:禁用', defaultValue: 1 })
  declare status: number

  @Column({ type: DataType.TEXT, comment: '备注' })
  declare remark: string

  // 关联关系
  @BelongsTo(() => DynamicForm, 'formId')
  declare form: DynamicForm

  // methods
  // ------------------------------------------------
  static findPagination = findPagination
}
