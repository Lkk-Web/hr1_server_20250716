import { BelongsTo, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Material } from '@model/base/material.model'
import { User } from '@model/sys/user.model'
import { EquipmentLedger } from '@model/em/equipmentLedger.model'
import { BOM } from '@model/base/bom.model'
import { Customer } from '@model/base/customer.model'
import { FileList } from '@model/dm/FileList.model'
import { Process } from '@model/process/process.model'
import { SOP } from '@model/process/SOP.model'

@Table({ tableName: 'process_sop_material', freezeTableName: true, timestamps: true, comment: '作业指导书物料中间表' })
export class SOPMaterial extends BaseDate<SOPMaterial> {
  @ForeignKey(() => SOP)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: 'sopId',
  })
  declare sopId: number

  @ForeignKey(() => Material)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '物料Id',
  })
  declare materialId: number
}
