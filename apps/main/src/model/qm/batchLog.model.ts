import { Table, Column, Model, DataType, ForeignKey, BelongsTo, BelongsToMany } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Material, User, Warehouse } from '..';

/** 批次日志表 */
@Table({ tableName: `qm_batch_log`, freezeTableName: true, timestamps: true, comment: '批次日志表' })
export class BatchLog extends BaseDate<BatchLog> {
  @Column({
    comment: '来源批次号',
    type: DataType.STRING(128),
    allowNull: true, // 必填
  })
  declare sourceBatch: string

  @Column({
    comment: '去向批次号',
    type: DataType.STRING(128),
    allowNull: true, // 必填
  })
  declare goThereBatch: string

  @Column({
    comment: '初始批次号',
    type: DataType.STRING(128),
    allowNull: true, // 必填
  })
  declare oneBatch: string

  @Column({
    comment: '单据名称',
    type: DataType.STRING(128),
    allowNull: true, // 必填
  })
  declare djName: string

  @Column({
    type: DataType.DATE,
    comment: '业务日期',
  })
  declare ywDate: Date;

  @Column({
    comment: '单位',
    type: DataType.STRING(10),
    allowNull: true, // 必填
  })
  declare unit: string

  @Column({
    comment: '数量',
    type: DataType.INTEGER,
    allowNull: true, // 必填
  })
  declare num: number

  // 物料Id
  @ForeignKey(() => Material)
  @Column({
    comment: '物料Id',
    type: DataType.INTEGER,
    allowNull: false, // 必填
  })
  declare materialId: number

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '创建人',
  })
  declare createdUserId: number

  // 仓库Id
  @ForeignKey(() => Warehouse)
  @Column({
    comment: '仓库Id',
    type: DataType.INTEGER,
    allowNull: true, // 必填
  })
  declare warehouseId: number

  @BelongsTo(() => Material)
  declare material: Material

  @BelongsTo(() => User)
  declare createdUser: User

  @BelongsTo(() => Warehouse)
  declare warehouse: Warehouse
}
