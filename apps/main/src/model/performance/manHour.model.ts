import { Material } from '@model/base/material.model'
import { BaseDate } from '@model/shared/baseDate'
import { BelongsTo, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { PERFORMANCE_CONFIG_TYPE, PERFORMANCE_CONFIG_UNIT } from '@common/enum'
import { User } from '@model/sys/user.model'
import { ManHourProcess } from '@model/performance/manHourProcess.model'

/** 工时配置 */
@Table({ tableName: `performance_man_hour`, freezeTableName: true, timestamps: true, comment: '工时配置' })
export class ManHour extends BaseDate<ManHour> {
  @ForeignKey(() => Material)
  @Column({
    comment: '物料Id',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare materialId: number

  @Column({
    comment: '单位',
    type: DataType.STRING(10),
    allowNull: false,
  })
  declare unit: PERFORMANCE_CONFIG_UNIT

  @Column({
    comment: '工时类型',
    type: DataType.STRING(10),
    allowNull: false,
  })
  declare type: PERFORMANCE_CONFIG_TYPE

  @Column({
    comment: '开始日期',
    type: DataType.DATE,
    allowNull: false,
  })
  declare startDate: number | Date | string

  @Column({
    comment: '结束日期',
    type: DataType.DATE,
  })
  declare endDate: number | Date | string

  @Column({
    comment: '备注',
    type: DataType.STRING,
  })
  declare desc: string

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    comment: '创建人id',
  })
  declare createById: number

  @BelongsTo(() => Material, { foreignKey: 'materialId', constraints: false, foreignKeyConstraint: false })
  declare material: Material

  @HasMany(() => ManHourProcess)
  declare manHourProcess: ManHourProcess[]
}
