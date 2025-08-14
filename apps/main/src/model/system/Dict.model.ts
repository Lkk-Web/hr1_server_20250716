import { AutoIncrement, BelongsTo, Column, CreatedAt, DataType, ForeignKey, HasMany, HasOne, Model, PrimaryKey, Table, UpdatedAt } from 'sequelize-typescript'
import { findPagination } from '@model/shared/method'
import { BaseDate } from '@model/shared/baseDate'
import { DICT_TYPE } from '@common/enum'
/**系统对接字典表 */
@Table({ tableName: `system_dict`, timestamps: false, freezeTableName: true, comment: '字典表' })
export class Dict extends BaseDate<Dict> {
  @Column({ type: DataType.ENUM(...Object.values(DICT_TYPE)), comment: '字典类型' })
  declare type: string

  @Column({ type: DataType.STRING, comment: '字典编码' })
  declare code: string

  @Column({ type: DataType.STRING, comment: '字典内容' })
  declare content: string
}