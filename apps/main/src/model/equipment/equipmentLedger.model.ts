import { BelongsTo, Column, DataType, ForeignKey, HasOne, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Supplier } from '@model/base/supplier.model'
import { User } from '@model/auth/user'
import { EquipmentType } from '@model/equipment/equipmentType.model'
import { Equipment } from '@model/equipment/equipment.model'
import { FileList } from '@model/document/FileList.model'
import { WorkShop } from '@model/base/workShop.model'
import { InstallLocation } from '@model/equipment/installLocation.model'
import { InspectionPlan } from '@model/equipment/inspectionPlan.model'
import { CheckStandard } from '@model/equipment/checkStandard.model'
import { MaintenancePlan } from '@model/equipment/maintenancePlan.model'
import { TeamEquipmentLedger } from '@model/auth/teamEquipmentLedger.model'

@Table({ tableName: `equipment_ledger`, freezeTableName: true, timestamps: true, comment: '设备台账表' })
export class EquipmentLedger extends BaseDate<EquipmentLedger> {
  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    comment: '设备台账编码',
  })
  declare code: string

  @ForeignKey(() => EquipmentType)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '设备类型Id',
  })
  declare equipmentTypeId: number

  @ForeignKey(() => Equipment)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '设备Id',
  })
  declare equipmentId: number

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    comment: '设备状态',
  })
  declare status: string

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    comment: '设备规格',
  })
  declare spec: string

  @Column({
    type: DataType.JSON,
    allowNull: true,
    comment: '设备图片',
  })
  declare image: string[]

  @ForeignKey(() => FileList)
  @Column({
    comment: '技术手册文件Id',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare fileId: number

  @ForeignKey(() => WorkShop)
  @Column({
    comment: '车间Id',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare workShopId: number

  @ForeignKey(() => InstallLocation)
  @Column({
    comment: '安装地点Id',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare installLocationId: number

  @ForeignKey(() => Supplier)
  @Column({
    comment: '生产厂家Id',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare manufacturerId: number

  @ForeignKey(() => Supplier)
  @Column({
    comment: '供应商Id',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare supplierId: number

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '购买日期',
  })
  declare purchaseDate: Date

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '启用日期',
  })
  declare activationDate: Date

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '备注',
  })
  declare remark: string

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '创建人',
  })
  declare createdUserId: number

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '更新人',
  })
  declare updatedUserId: number

  @ForeignKey(() => InspectionPlan)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '巡检计划Id',
  })
  declare inspectionPlanId: number

  @ForeignKey(() => CheckStandard)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '点检标准Id',
  })
  declare checkStandardId: number

  @ForeignKey(() => MaintenancePlan)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '保养方案',
  })
  declare maintenancePlanId: number

  @BelongsTo(() => CheckStandard, { foreignKey: 'checkStandardId', constraints: false, foreignKeyConstraint: false })
  checkStandard: CheckStandard

  @BelongsTo(() => InspectionPlan, { foreignKey: 'inspectionPlanId', constraints: false, foreignKeyConstraint: false })
  inspectionPlan: InspectionPlan

  @BelongsTo(() => MaintenancePlan, { foreignKey: 'maintenancePlanId', constraints: false, foreignKeyConstraint: false })
  maintenancePlan: MaintenancePlan

  @BelongsTo(() => EquipmentType)
  equipmentType: EquipmentType

  @BelongsTo(() => Equipment)
  equipment: Equipment

  @BelongsTo(() => FileList)
  file: FileList

  @BelongsTo(() => WorkShop)
  workShop: WorkShop

  @BelongsTo(() => InstallLocation)
  installLocation: InstallLocation

  @BelongsTo(() => Supplier, 'manufacturerId')
  manufacturer: Supplier

  @BelongsTo(() => Supplier, 'supplierId')
  supplier: Supplier

  @BelongsTo(() => User, 'createdUserId')
  createdUser: User

  @BelongsTo(() => User, 'updatedUserId')
  updatedUser: User

  @HasOne(() => TeamEquipmentLedger)
  declare teamEquipmentLedger: TeamEquipmentLedger

  declare checkOrder: any[]

  declare inspectionOrder: any[]

  declare repairOrder: any[]

  declare maintenanceOrder: any[]

  declare scrapOrder: any[]
}
