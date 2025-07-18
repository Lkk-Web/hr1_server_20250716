import { Material } from '@model/base/material.model'
import { Process } from '@model/pm/process.model'
import { BaseDate } from '@model/shared/baseDate'
import { BelongsTo, Column, DataType, ForeignKey, Table } from 'sequelize-typescript'

/** 绩效工资配置 */
@Table({ tableName: `pp_performance_config`, freezeTableName: true, timestamps: true, comment: '绩效工资配置表' })
export class PerformanceConfig extends BaseDate<PerformanceConfig> {
  @ForeignKey(() => Material)
  @Column({
    comment: '物料Id',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare materialId: number

  @Column({
    comment: '工序Id',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare processId: number

  @Column({
    comment: '计价方式（计件，计时）',
    type: DataType.STRING(16),
    defaultValue: '计件',
  })
  declare pricingMethod: string

  @Column({
    comment: '良品单价（保留4位）',
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 10000,
  })
  declare goodCountPrice: number

  @Column({
    comment: '不良品单价（保留4位）',
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: -10000,
  })
  declare badCountPrice: number

  @Column({
    comment: '标准工时（秒）',
    type: DataType.INTEGER,
    defaultValue: 3600,
  })
  declare canonTime: number

  @Column({
    comment: '标准产出',
    type: DataType.INTEGER,
    defaultValue: 1,
  })
  declare canonNum: number

  @BelongsTo(() => Material, { foreignKey: 'materialId', constraints: false, foreignKeyConstraint: false })
  declare material: Material

  @BelongsTo(() => Process, { foreignKey: 'processId', constraints: false, foreignKeyConstraint: false })
  declare process: Process
}
