import { BelongsTo, BelongsToMany, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/sys/user.model'
import { InspectionFormInfo } from '@model/quantity/inspectionFormInfo.model'
import { Process } from '@model/process/process.model'
import { ProductionReport } from '@model/production/productionReport.model'
import { InspectionFormBy } from '@model/quantity/inspectionFormBy.model'

/** 报工检验单 */
@Table({ tableName: `quantity_inspection_form`, freezeTableName: true, timestamps: true, comment: '报工检验单' })
export class InspectionForm extends BaseDate<InspectionForm> {
  @Column({
    comment: '检验单编码',
    type: DataType.STRING(50),
    allowNull: true,
  })
  declare code: string

  // 检验项类型：必填项
  @Column({
    comment: '检验类型',
    type: DataType.STRING(128),
    allowNull: true,
  })
  declare type: string

  @Column({
    comment: '检验日期',
    type: DataType.DATE,
    allowNull: true,
  })
  declare inspectionAt: Date

  @Column({
    comment: '状态',
    type: DataType.STRING(20),
    allowNull: true,
    defaultValue: '暂存',
  })
  declare status: string

  @Column({
    comment: '源单编号',
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare originCode: string

  @Column({
    comment: '源单类型',
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare originType: string

  @ForeignKey(() => User)
  @Column({
    comment: '审核人',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare auditorId: number

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '审核时间',
  })
  declare auditedAt: Date

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '创建人',
  })
  declare createdUserId: number

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '更新人',
  })
  declare updatedUserId: number

  // @ForeignKey(() => User)
  // @Column({
  //   type: DataType.INTEGER,
  //   allowNull: true,
  //   comment: '质检人',
  // })
  // declare inspectorId: number

  @Column({
    comment: '备注',
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remark: string

  @ForeignKey(() => Process)
  @Column({
    comment: '工序Id',
    type: DataType.INTEGER,
  })
  declare processId: number

  @ForeignKey(() => ProductionReport)
  @Column({
    comment: '生产报工表id',
    type: DataType.INTEGER,
  })
  declare productionReportId: number

  @BelongsTo(() => User, { foreignKey: 'createdUserId', constraints: false, foreignKeyConstraint: false })
  declare createdUser: User

  @BelongsTo(() => User, { foreignKey: 'updatedUserId', constraints: false, foreignKeyConstraint: false })
  declare updatedUser: User

  @BelongsTo(() => User, { foreignKey: 'auditorId', constraints: false, foreignKeyConstraint: false })
  declare auditor: User

  // @BelongsTo(() => User, { foreignKey: 'inspectorId', constraints: false, foreignKeyConstraint: false })
  // declare inspector: User

  @BelongsTo(() => Process, { foreignKey: 'processId', constraints: false, foreignKeyConstraint: false })
  declare process: Process

  @HasMany(() => InspectionFormInfo)
  declare infos: InspectionFormInfo[]

  @BelongsToMany(() => User, () => InspectionFormBy)
  declare inspectors: User[]
}
