import { Table, Column, Model, DataType, HasMany, ForeignKey, BelongsTo } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Material } from '@model/base/material.model'
import { User } from '@model/auth/user'
import { ProcessRoute } from '@model/process/processRoute.model'
import { Process } from '@model/process/process.model'
import { ProcessRouteListItem } from '@model/process/processRouteListItem.model'
import { FileList } from '@model/document/FileList.model'

/** 工艺路线绑定Bom分组 */
@Table({ tableName: `process_route_bom_group`, freezeTableName: true, timestamps: true, comment: '工艺路线绑定Bom分组' })
export class ProcessRouteListBomGroup extends BaseDate<ProcessRouteListBomGroup> {
  @ForeignKey(() => ProcessRoute)
  @Column({
    comment: '工艺路线Id',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare processRouteId: number

  @Column({
    comment: 'Bom分组id',
    type: DataType.STRING,
    allowNull: false,
  })
  declare groupId: string

  @Column({
    comment: 'Bom分组名称',
    type: DataType.STRING,
    allowNull: false,
  })
  declare groupName: string

  @BelongsTo(() => ProcessRoute)
  declare processRoute: ProcessRoute
}
