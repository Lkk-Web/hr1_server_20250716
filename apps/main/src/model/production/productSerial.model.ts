import { BelongsTo, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { ProductionOrderTask } from '@model/production/productionOrderTask.model'
import { ProcessTask } from '@model/production/processTask.model'
import { BaseModel } from '@model/shared/base.model'
import { ProductSerialStatus } from '@common/enum'
import { Material } from '@model/base/material.model'
import { IronProductSerial } from './ironProductSerial.model'

/** 产品序列号表 */
@Table({ tableName: `product_serial`, freezeTableName: true, timestamps: true, comment: '产品序列号表' })
export class ProductSerial extends BaseModel<ProductSerial> {
  // 产品序列号
  @Column({
    comment: '产品序列号',
    type: DataType.STRING(100),
    allowNull: false,
    unique: true,
  })
  declare serialNumber: string

  @ForeignKey(() => ProductionOrderTask)
  @Column({
    comment: '生产订单任务ID',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare productionOrderTaskId: number

  @ForeignKey(() => Material)
  @Column({
    comment: '物料ID',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare materialId: number

  // 状态
  @Column({
    comment: '状态',
    type: DataType.ENUM(...Object.values(ProductSerialStatus)),
    allowNull: false,
    defaultValue: ProductSerialStatus.NOT_STARTED,
  })
  declare status: ProductSerialStatus

  // 数量（固定为1）
  @Column({
    comment: '数量（固定为1）',
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
  })
  declare quantity: number

  // 当前工序ID
  @ForeignKey(() => ProcessTask)
  @Column({
    comment: '当前工序任务ID',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare currentProcessTaskId: number

  // 质量状态
  @Column({
    comment: '质量状态（合格、不合格、待检）',
    type: DataType.ENUM('合格', '不合格', '待检'),
    allowNull: false,
    defaultValue: '待检',
  })
  declare qualityStatus: string

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

  // 关联关系
  @BelongsTo(() => ProductionOrderTask, 'productionOrderTaskId')
  declare productionOrderTask: ProductionOrderTask

  @BelongsTo(() => ProcessTask, 'currentProcessTaskId')
  declare currentProcessTask: ProcessTask

  @HasMany(() => ProcessTask)
  declare processTasks: ProcessTask[]

  @HasMany(() => IronProductSerial)
  declare ironSerial: IronProductSerial[]

  @BelongsTo(() => Material, 'materialId')
  declare material: Material
}
