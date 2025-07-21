import { Table, Column, Model, DataType, HasMany, ForeignKey, BelongsTo } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Material } from '@model/base/material.model'
import { User } from '@model/auth/user'
import { ProcessRoute } from '@model/process/processRoute.model'
import { Process } from '@model/process/process.model'
import { ProcessRouteList } from '@model/process/processRouteList.model'
import { DefectiveItem } from '@model/quantity/defectiveItem.model'

@Table({
  tableName: `process_route_list_item`,
  freezeTableName: true,
  timestamps: true,
  comment: '工艺路线的工序关联不良品项表',
})
export class ProcessRouteListItem extends BaseDate<ProcessRouteListItem> {
  @ForeignKey(() => ProcessRouteList)
  @Column({
    comment: '关联工艺路线工序列表Id',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare processRouteListId: number

  @ForeignKey(() => DefectiveItem)
  @Column({
    comment: '关联不良品项Id',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare defectiveItemId: number

  @BelongsTo(() => DefectiveItem)
  declare defectiveItem: DefectiveItem
}
