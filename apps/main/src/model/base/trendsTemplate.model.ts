import { Column, CreatedAt, DataType, HasMany, Table, UpdatedAt } from 'sequelize-typescript'
import { BaseDate } from '../shared/baseDate'
import { TrendsField } from './trendsField.model'

/** 动态字段模版表 */
@Table({ tableName: `base_trends_template`, freezeTableName: true, timestamps: true, comment: '动态字段模板表' })
export class TrendsTemplate extends BaseDate<TrendsTemplate> {
  @Column({
    comment: '模版名称',
    type: DataType.STRING(255),
  })
  declare name: string

  @Column({
    comment: '模版类型',
    type: DataType.STRING(255),
  })
  declare types: string

  @Column({
    comment: '模版code',
    type: DataType.STRING(255),
  })
  declare code: string

  @Column({
    comment: '动态模版描述',
    type: DataType.STRING(255),
  })
  declare describe: string

  @Column({
    comment: '排序',
    type: DataType.INTEGER,
  })
  declare sort: number

  @HasMany(() => TrendsField)
  declare trendsFieldDatas: TrendsField[]

  @CreatedAt
  @Column
  declare createdAt?: Date

  @UpdatedAt
  @Column
  declare updatedAt?: Date
}
