import { Table, Column, Model, DataType, HasMany, ForeignKey, BelongsTo } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Material } from '@model/base/material.model'
import { User } from '@model/sys/user.model'
import { ProcessRoute } from '@model/process/processRoute.model'
import { Process } from '@model/process/process.model'
import { ProcessRouteListItem } from '@model/process/processRouteListItem.model'
import { FileList } from '@model/dm/FileList.model'

/** 工艺路线关联工序子表 */
@Table({ tableName: `process_route_list`, freezeTableName: true, timestamps: true, comment: '工艺路线关联工序子表' })
export class ProcessRouteList extends BaseDate<ProcessRouteList> {
  @ForeignKey(() => ProcessRoute)
  @Column({
    comment: '关联工艺路线Id',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare processRouteId: number

  @ForeignKey(() => Process)
  @Column({
    comment: '工序Id',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare processId: number

  // 报工数比例
  @Column({
    comment: '报工数比例',
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 1,
  })
  declare reportRatio: number

  // 报工数比例
  @Column({
    comment: '是否报工',
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  declare isReport: boolean

  @Column({
    comment: '是否委外',
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  declare isOutsource: boolean

  @ForeignKey(() => FileList)
  @Column({
    comment: 'fileId',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare fileId: number

  @Column({
    comment: 'sort',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare sort: number

  @Column({
    comment: '是否进行质检',
    type: DataType.BOOLEAN,
    allowNull: true,
    defaultValue: true,
  })
  declare isInspection: boolean

  @BelongsTo(() => Process)
  declare process: Process

  @HasMany(() => ProcessRouteListItem)
  declare items: ProcessRouteListItem[]

  @BelongsTo(() => FileList)
  file: FileList
}
