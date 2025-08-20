import { BelongsTo, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Material } from '@model/base/material.model'
import { User } from '@model/auth/user'
import { EquipmentLedger } from '@model/equipment/equipmentLedger.model'
import { BOM } from '@model/base/bom.model'
import { Customer } from '@model/base/customer.model'
import { FileList } from '@model/document/FileList.model'
import { Process } from '@model/process/process.model'
import { SOP } from '@model/process/SOP.model'

@Table({ tableName: 'process_so_parameter', freezeTableName: true, timestamps: true, comment: '工艺参数作业指导书文件中间表' })
export class SOParameter extends BaseDate<SOParameter> {
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
