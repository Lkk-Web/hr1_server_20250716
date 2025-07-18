import { BelongsTo, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { Material } from '@model/base/material.model'
import { POP } from '@model/pe/POP.model'
import { POB } from '@model/pe/POB.model'
import { ProcessTask } from '@model/pe/processTask.model'
import { BOM } from '@model/base/bom.model'
import { SalesOrder } from '@model/ps/salesOrder.model'
import { StrBaseModel } from '@model/shared/strBase.model'
import { STORAGE_TYPE } from '@common/enum'

@Table({ tableName: `pe_production_order`, freezeTableName: true, timestamps: true, comment: '生产工单表' })
export class ProductionOrder extends StrBaseModel<ProductionOrder> {
  @Column({
    comment: '金蝶编号',
    type: DataType.STRING(50),
    allowNull: true,
  })
  declare kingdeeCode: string

  @Column({
    comment: '金蝶行标识',
    type: DataType.STRING(50),
    allowNull: true,
  })
  declare kingdeeRow: string

  @Column({
    comment: '金蝶主订单id',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare fid: number

  // 工单编号
  @Column({
    comment: '工单编号',
    type: DataType.STRING(50),
    allowNull: false, // 必填项
  })
  declare code: string

  @ForeignKey(() => BOM)
  // 产品编码
  @Column({
    comment: '产品Bom ID',
    type: DataType.INTEGER,
    allowNull: true, // 必填项
  })
  declare bomId: number

  @ForeignKey(() => SalesOrder)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '销售订单Id',
  })
  declare salesOrderId: number

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    comment: '销售订单号',
  })
  declare salesOrderCode: string

  @ForeignKey(() => Material)
  // 产品编码
  @Column({
    comment: '4级产品ID',
    type: DataType.INTEGER,
    allowNull: true, // 必填项
  })
  declare topMaterialId: number

  @ForeignKey(() => Material)
  // 产品编码
  @Column({
    comment: '2级产品ID',
    type: DataType.INTEGER,
    allowNull: true, // 必填项
  })
  declare subMaterialId: number

  // 业务状态
  @Column({
    comment: '业务状态',
    type: DataType.STRING(10),
    allowNull: true,
  })
  declare FStatus: string

  // 状态
  @Column({
    comment: '状态 (未开始, 执行中, 已暂停, 已取消, 已完成)',
    type: DataType.STRING(10),
    allowNull: false, // 必填项
    defaultValue: '未开始',
  })
  declare status: string

  // 排产状态
  @Column({
    comment: '排产状态 (未排产, 已排产)',
    type: DataType.ENUM('未排产', '已排产'),
    allowNull: false, // 必填项
    defaultValue: '未排产',
  })
  declare schedulingStatus: string

  // 优先级
  @Column({
    comment: '优先级 (加急, 普通, 无)',
    type: DataType.STRING(10),
    allowNull: false, // 必填项
    defaultValue: '无',
  })
  declare priority: string

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

  // 实际产出
  @Column({
    comment: '实际产出 (数量)',
    type: DataType.INTEGER,
    allowNull: true, // 可选项
    defaultValue: 0,
  })
  declare actualOutput: number

  // 实际开始时间
  @Column({
    comment: '实际开始时间',
    type: DataType.DATE,
    allowNull: true, // 可选项
  })
  declare actualStartTime: Date

  // 实际结束时间
  @Column({
    comment: '实际结束时间',
    type: DataType.DATE,
    allowNull: true, // 可选项
  })
  declare actualEndTime: Date

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
    comment: '是否已产生过生产入库单',
    type: DataType.INTEGER,
  })
  declare isCreated: number

  @Column({
    comment: '金蝶行号',
    type: DataType.INTEGER,
  })
  declare fseq: number

  @Column({
    comment: '单据类型',
    type: DataType.STRING,
  })
  declare billType: STORAGE_TYPE

  @BelongsTo(() => BOM, 'bomId')
  declare bom: BOM

  @BelongsTo(() => Material, 'topMaterialId')
  declare tomMaterial: Material

  @BelongsTo(() => Material, 'subMaterialId')
  declare subMaterial: Material

  @BelongsTo(() => SalesOrder)
  declare salesOrder: SalesOrder

  @HasMany(() => POP)
  declare processes: POP[]

  @HasMany(() => POB)
  declare boms: POB[]

  @HasMany(() => ProcessTask)
  declare tasks: ProcessTask[]
}
