import { BelongsTo, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Material } from '@model/base/material.model'
import { User } from '@model/sys/user.model'
import { EquipmentLedger } from '@model/em/equipmentLedger.model'
import { BOM } from '@model/base/bom.model'
import { Customer } from '@model/base/customer.model'
import { FileList } from '@model/dm/FileList.model'
import { Process } from '@model/pm/process.model'
import { SOP } from '@model/pm/SOP.model'

@Table({ tableName: 'pm_sop_file', freezeTableName: true, timestamps: true, comment: '作业指导书文件中间表' })
export class SOPFile extends BaseDate<SOPFile> {
  @ForeignKey(() => SOP)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: 'sopId',
  })
  declare sopId: number

  @ForeignKey(() => FileList)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '文件Id',
  })
  declare fileListId: number
}
