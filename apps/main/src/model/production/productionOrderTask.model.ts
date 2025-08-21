import { BelongsTo, BelongsToMany, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { Material } from '@model/base/material.model'
import { ProductionOrderDetail } from '@model/production/productionOrderDetail.model'
import { LocateStatus, ProductionOrderTaskStatus, SchedulingStatus } from '@common/enum'
import { BaseModel } from '@model/shared/base.model'
import { ProductSerial } from './productSerial.model'
import { ProductionOrderTaskTeam } from './productionOrderTaskOfTeam.model'
import { Team } from '@model/auth/team'
import { ProductionReportDetail } from './productionReportDetail.model'
import { ProcessLocate } from './processLocate.model'

/** 生产订单任务表 */
@Table({ tableName: `production_order_task`, freezeTableName: true, timestamps: true, comment: '生产工单表 - 排产 -含多个产品序列号' })
export class ProductionOrderTask extends BaseModel<ProductionOrderTask> {
  // 拆单编号
  @Column({
    comment: '工单编号',
    type: DataType.STRING(100),
    allowNull: false,
    unique: true,
  })
  declare orderCode: string

  @ForeignKey(() => ProductionOrderDetail)
  @Column({
    comment: '生产订单详情ID',
    type: DataType.STRING(50),
    allowNull: false,
  })
  declare productionOrderDetailId: string

  @ForeignKey(() => Material)
  @Column({
    comment: '物料ID',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare materialId: number

  // 拆分数量
  @Column({
    comment: '拆分数量',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare splitQuantity: number

  // 排程状态
  @Column({
    comment: '排程状态',
    type: DataType.ENUM(...Object.values(SchedulingStatus)),
    allowNull: false,
    defaultValue: SchedulingStatus.NOT_SCHEDULED,
  })
  declare schedulingStatus: SchedulingStatus

  // 派工状态
  @Column({
    comment: '派工状态',
    type: DataType.ENUM(...Object.values(LocateStatus)),
    allowNull: false,
    defaultValue: LocateStatus.NOT_LOCATED,
  })
  declare locateStatus: LocateStatus

  // 计划开始时间
  @Column({
    comment: '计划开始时间',
    type: DataType.DATE,
    allowNull: false,
  })
  declare startTime: Date

  // 计划结束时间
  @Column({
    comment: '计划结束时间',
    type: DataType.DATE,
    allowNull: false,
  })
  declare endTime: Date

  // 实际开始时间
  @Column({
    comment: '实际开始时间',
    type: DataType.DATE,
    allowNull: true,
  })
  declare actualStartTime: Date

  // 实际结束时间
  @Column({
    comment: '实际结束时间',
    type: DataType.DATE,
    allowNull: true,
  })
  declare actualEndTime: Date

  // 生产车间
  @Column({
    comment: '生产车间',
    type: DataType.STRING(50),
    allowNull: true,
  })
  declare workShop: string

  // 实际产出
  @Column({
    comment: '实际产出数量',
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 0,
  })
  declare actualOutput: number

  // 良品数
  @Column({
    comment: '良品数',
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 0,
  })
  declare goodCount: number

  // 不良品数
  @Column({
    comment: '不良品数',
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 0,
  })
  declare badCount: number

  // 优先级
  @Column({
    comment: '优先级 (无, 加急, 暂停)',
    type: DataType.ENUM('无', '加急', '暂停'),
    allowNull: false,
    defaultValue: '无',
  })
  declare priority: string

  // 备注
  @Column({
    comment: '备注',
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remark: string

  // 创建人
  @Column({
    comment: '创建人',
    type: DataType.STRING(50),
    allowNull: true,
  })
  declare createdBy: string

  @BelongsTo(() => ProductionOrderDetail, 'productionOrderDetailId')
  declare productionOrderDetail: ProductionOrderDetail

  @BelongsTo(() => Material, 'materialId')
  declare material: Material

  @HasMany(() => ProductSerial)
  declare productSerials: ProductSerial[]

  @BelongsToMany(() => Team, () => ProductionOrderTaskTeam)
  declare teams: Team[]

  @HasMany(() => ProcessLocate)
  declare processLocates: ProcessLocate[]

  @HasMany(() => ProductionReportDetail, 'productionOrderTaskId')
  declare productionReportDetails: ProductionReportDetail[]
}
