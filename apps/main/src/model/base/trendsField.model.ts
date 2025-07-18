import { AutoIncrement, Column, DataType, Default, ForeignKey, PrimaryKey, Table } from 'sequelize-typescript'
import { BaseDate } from '../shared/baseDate'
import { TrendsTemplate } from './trendsTemplate.model'

/** 动态字段表 */
@Table({ tableName: `base_trends_field`, freezeTableName: true, timestamps: false, comment: '动态字段表' })
export class TrendsField extends BaseDate<TrendsField> {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number

  @ForeignKey(() => TrendsTemplate)
  @Column({
    comment: '字段模版id',
    type: DataType.INTEGER,
  })
  declare templateId: number

  @Column({
    comment: '字段名称',
    type: DataType.STRING(255),
  })
  declare name: string

  @Column({
    comment: '字段类型（1单行文本，2多行文本，3单选，4多选，5日期，6图片，7文件）',
    type: DataType.STRING(10),
  })
  declare types: string

  @Column({
    comment: '是否必填',
    type: DataType.BOOLEAN,
  })
  declare state: Boolean

  @Column({
    comment: '字符长度',
    type: DataType.INTEGER,
  })
  declare len: number

  @Column({
    comment: '排序',
    type: DataType.INTEGER,
  })
  declare sort: number

  // @Column({
  //   comment: '显隐状态（0隐藏，1显示）',
  //   type: DataType.STRING(5)
  // })
  // declare displayState: string;

  @Column({
    comment: '输入提示',
    type: DataType.STRING(255),
  })
  declare tip: string

  @Column({
    comment: '默认值',
    type: DataType.STRING(255),
  })
  declare defaultValue: string

  @Column({
    comment: '选项（单选，多选及时间时有该内容）',
    type: DataType.JSON,
  })
  declare fieldOption: any

  @Column({
    comment: '是否是在首页列表中展示',
    type: DataType.BOOLEAN,
  })
  declare status: Boolean

  @Default(true)
  @Column({
    comment: '是否允许编辑',
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare isEdit: boolean
}
