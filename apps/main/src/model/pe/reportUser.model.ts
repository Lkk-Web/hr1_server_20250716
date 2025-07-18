import { BelongsTo, Column, DataType, ForeignKey, Table } from 'sequelize-typescript'
import { BaseModel } from '@model/shared/base.model'
import { ReportUserDuration } from '@model/pe/reportUserDuration.model'
import { ProductionReport } from '@model/pe/productionReport.model'

@Table({ tableName: `pe_report_user`, timestamps: false, comment: '生产报工与员工时长' })
export class ReportUser extends BaseModel<ReportUser> {

  @ForeignKey(() => ReportUserDuration)
  @Column({
    comment: '员工时长id',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare userDurationId: number

  @ForeignKey(() => ProductionReport)
  @Column({
    comment: '生产报工表id',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare productionReportId: number

  @Column({
    comment: '所用时长 单位/s',
    type: DataType.INTEGER,
  })
  declare duration: number


  @BelongsTo(() => ReportUserDuration)
  declare userDuration: ReportUserDuration


  @BelongsTo(() => ProductionReport)
  declare productionReport: ProductionReport

}
