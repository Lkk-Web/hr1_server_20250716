import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Material, Process, ProcessTask, ProductionOrder, Supplier, User } from '..'

@Table({ tableName: `production_outsourcing`, timestamps: true, comment: '工序委外' })
export class ProductionOutsourcing extends BaseDate<ProductionOutsourcing> {
  @Column({
    comment: '工序委外单编号',
    type: DataType.STRING(20),
    allowNull: false, // 必填项
  })
  declare code: string

  //工单ID
  @ForeignKey(() => ProductionOrder)
  @Column({
    comment: '工单id',
    type: DataType.STRING(255),
    allowNull: true, // 必填项
  })
  declare productionOrderId: string

  @ForeignKey(() => Material)
  @Column({
    comment: '产品ID',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare materialId: number

  @ForeignKey(() => Process)
  @Column({
    comment: '工序Id',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare processId: number

  @ForeignKey(() => ProcessTask)
  @Column({
    comment: '工序任务单ID',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare taskId: number

  @Column({
    comment: '状态（未审核，已审核）',
    type: DataType.STRING(10),
    allowNull: true,
    defaultValue: '未审核',
  })
  declare status: string

  @Column({
    comment: '单据类型（委外发出,委外接收）',
    type: DataType.STRING(10),
    allowNull: true,
    defaultValue: '委外发出',
  })
  declare types: string

  @ForeignKey(() => Supplier)
  @Column({
    comment: '供应商id',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare supplierId: number

  @Column({
    comment: '单据日期',
    type: DataType.DATE,
    allowNull: false,
  })
  declare startTime: Date

  @Column({
    comment: '委外数量',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare num: number

  @Column({
    comment: '接收数量',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare endNum: number

  @Column({
    comment: '单位',
    type: DataType.STRING(10),
    allowNull: true,
  })
  declare unit: string

  @Column({
    comment: '良品数',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare goodCount: number

  @Column({
    comment: '不良品数',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare badCount: number

  @Column({
    comment: '良品单价（元）',
    type: DataType.DOUBLE,
    allowNull: true,
    defaultValue: 0,
  })
  declare goodCountPrice: number

  @Column({
    comment: '不良品单价（元）',
    type: DataType.DOUBLE,
    allowNull: true,
    defaultValue: 0,
  })
  declare badCountPrice: number

  @Column({
    comment: '预估结算金额（元）',
    type: DataType.DOUBLE,
    allowNull: true,
    defaultValue: 0,
  })
  declare estimatedWage: number

  @ForeignKey(() => User)
  @Column({
    comment: '审核人',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare auditorId: number

  @Column({
    comment: '审核时间',
    type: DataType.DATE,
    allowNull: true,
  })
  declare auditedAt?: Date

  @BelongsTo(() => ProductionOrder, { foreignKey: 'productionOrderId', constraints: false, foreignKeyConstraint: false })
  order: ProductionOrder

  @BelongsTo(() => Process, { foreignKey: 'processId', constraints: false, foreignKeyConstraint: false })
  process: Process

  @BelongsTo(() => ProcessTask, { foreignKey: 'taskId', constraints: false, foreignKeyConstraint: false })
  task: ProcessTask

  @BelongsTo(() => User, { foreignKey: 'auditorId', constraints: false, foreignKeyConstraint: false })
  auditor: User

  @BelongsTo(() => Supplier, { foreignKey: 'supplierId', constraints: false, foreignKeyConstraint: false })
  supplier: Supplier

  @BelongsTo(() => Material, { foreignKey: 'materialId', constraints: false, foreignKeyConstraint: false })
  material: Material
}
