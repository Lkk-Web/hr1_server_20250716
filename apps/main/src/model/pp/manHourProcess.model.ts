import { Process } from '@model/pm/process.model'
import { BaseDate } from '@model/shared/baseDate'
import { BelongsTo, Column, DataType, ForeignKey, Table } from 'sequelize-typescript'
import { ManHour } from '@model/pp/manHour.model'

/** 工时配置 */
@Table({ tableName: `pp_man_hour_process`, freezeTableName: true, timestamps: true, comment: '工时配置' })
export class ManHourProcess extends BaseDate<ManHourProcess> {
  @ForeignKey(() => ManHour)
  @Column({
    comment: '工时配置id',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare manHourId: number

  @ForeignKey(() => Process)
  @Column({
    comment: '工序Id',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare processId: number

  @Column({
    comment: '标准收入',
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 1,
  })
  declare canonNum: number

  @BelongsTo(() => Process, { foreignKey: 'processId', constraints: false, foreignKeyConstraint: false })
  declare process: Process
}
