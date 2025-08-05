import { BelongsToMany, Column, DataType, HasMany, HasOne, Table, BelongsTo } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { TeamProcess } from '@model/auth/teamProcess'

/** 工序表 */
@Table({ tableName: `process`, freezeTableName: true, timestamps: true, comment: '工序表' })
export class Process extends BaseDate<Process> {
  // 工序名称
  @Column({
    comment: '工序名称',
    type: DataType.STRING(128),
    allowNull: false,
  })
  declare processName: string

  // 报工数比例
  @Column({
    comment: '报工数比例',
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 1,
  })
  declare reportRatio: number

  // 父级工序ID
  @Column({
    comment: '父级工序ID',
    type: DataType.INTEGER,
  })
  declare parentId: number

  //1为父工序 0为子工序
  @Column({
    comment: '是否为子工序',
    type: DataType.INTEGER,
  })
  declare isChild: number

  @Column({
    comment: '是否为外包工序',
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare isOut: boolean

  // 排序字段
  @Column({
    comment: '排序字段',
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
  })
  declare sort: number

  // 添加父子关系关联
  @BelongsTo(() => Process, { foreignKey: 'parentId', as: 'parent' })
  declare parent: Process

  @HasMany(() => Process, { foreignKey: 'parentId', as: 'children' })
  declare children: Process[]

  @HasOne(() => TeamProcess)
  declare teamProcess: TeamProcess
}
