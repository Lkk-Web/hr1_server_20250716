import { BelongsTo, Column, DataType, ForeignKey, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/sys/user.model'
import { CheckStandard } from '@model/em/checkStandard.model'

@Table({ tableName: `em_check_standard_detail`, freezeTableName: true, timestamps: true, comment: '点检标准明细表' })
export class CheckStandardDetail extends BaseDate<CheckStandardDetail> {
  @ForeignKey(() => CheckStandard)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '点检标准Id',
  })
  declare checkStandardId: number

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '检查项名称',
  })
  declare name: string

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '点检方法',
  })
  declare method: string

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    comment: '最小值',
  })
  declare min: number

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    comment: '最大值',
  })
  declare max: number

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    comment: '状态',
    defaultValue: true,
  })
  declare status: boolean

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '备注',
  })
  declare remark: string
}
