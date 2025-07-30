import { BelongsTo, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { Material } from '@model/base/material.model'
import { POP } from '@model/production/POP.model'
import { POB } from '@model/production/POB.model'
import { ProcessTask } from '@model/production/processTask.model'
import { SalesOrder } from '@model/plan/salesOrder.model'
import { StrBaseModel } from '@model/shared/strBase.model'
import { ProductionOrder } from './productionOrder.model'

@Table({ tableName: `production_order_detail`, freezeTableName: true, timestamps: true, comment: '生产订单明细表' })
export class ProductionOrderDetail extends StrBaseModel<ProductionOrderDetail> {
  @ForeignKey(() => ProductionOrder)
  @Column({
    comment: '生产订单ID',
    type: DataType.STRING(50),
    allowNull: true, // 必填项
  })
  declare productionOrderId: string

  // 工单编号
  @Column({
    comment: '产品订单编号',
    type: DataType.STRING(50),
    allowNull: false, // 必填项
  })
  declare orderCode: string

  @ForeignKey(() => Material)
  @Column({
    comment: '物料编码ID',
    type: DataType.INTEGER,
    allowNull: true, // 必填项
  })
  declare materialId: number

  // 状态
  @Column({
    comment: '状态 (未开始, 执行中, 已暂停, 已取消, 已完成)',
    type: DataType.STRING(10),
    allowNull: false, // 必填项
    defaultValue: '未开始',
  })
  declare status: string

  // 拆单状态
  @Column({
    comment: '拆单状态 (未拆单, 拆单中, 已拆单)',
    type: DataType.ENUM('未拆单', '拆单中', '已拆单'),
    allowNull: false, // 必填项
    defaultValue: '未拆单',
  })
  declare splitStatus: string

  // 计划产出
  @Column({
    comment: '计划产出 (数量)',
    type: DataType.INTEGER,
    allowNull: false, // 必填项
  })
  declare plannedOutput: number

  // 计划开始时间
  @Column({
    comment: '计划开始时间',
    type: DataType.DATE,
    allowNull: false, // 必填项
  })
  declare startTime: Date

  // 计划结束时间
  @Column({
    comment: '计划结束时间',
    type: DataType.DATE,
    allowNull: false, // 必填项
  })
  declare endTime: Date

  // 生产车间
  @Column({
    comment: '生产车间',
    type: DataType.STRING(50),
    allowNull: true, // 可选项
  })
  declare workShop: string

  // 实际产出
  @Column({
    comment: '实际产出 (数量)',
    type: DataType.INTEGER,
    allowNull: true, // 可选项
    defaultValue: 0,
  })
  declare actualOutput: number

  // // 实际开始时间
  // @Column({
  //   comment: '实际开始时间',
  //   type: DataType.DATE,
  //   allowNull: true, // 可选项
  // })
  // declare actualStartTime: Date

  // // 实际结束时间
  // @Column({
  //   comment: '实际结束时间',
  //   type: DataType.DATE,
  //   allowNull: true, // 可选项
  // })
  // declare actualEndTime: Date

  // 累计工时
  @Column({
    comment: '累计工时',
    type: DataType.INTEGER,
    allowNull: true, // 可选项
  })
  declare totalWorkingHours: number

  // 当前工序
  @Column({
    comment: '当前工序',
    type: DataType.STRING(50),
    allowNull: true, // 可选项
  })
  declare currentProcess: string

  @Column({
    comment: '备注',
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remark: string

  @Column({
    comment: '金蝶原始数据',
    type: DataType.TEXT,
    allowNull: true,
  })
  declare jsonData: string

  @BelongsTo(() => Material, 'materialId')
  declare material: Material

  @BelongsTo(() => ProductionOrder, 'productionOrderId')
  declare productionOrder: ProductionOrder

  // @HasMany(() => POP)
  // declare processes: POP[]

  @HasMany(() => POB)
  declare boms: POB[]

  // @HasMany(() => ProcessTask)
  // declare tasks: ProcessTask[]
}
