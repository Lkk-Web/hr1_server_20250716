import { Column, DataType, ForeignKey, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { InspectionFormInfo } from '@model/quantity/inspectionFormInfo.model'
import { Process } from '@model/process/process.model'

/** 报工检验单检验项目 */
@Table({ tableName: `quantity_inspection_form_result`, freezeTableName: true, timestamps: true, comment: '报工检验单检验结果' })
export class InspectionFormResult extends BaseDate<InspectionFormResult> {
  @ForeignKey(() => InspectionFormInfo)
  @Column({
    comment: '检验单物料明细Id',
    type: DataType.INTEGER,
    allowNull: false, // 必填项
  })
  declare inspectionFormInfoId: number

  @Column({
    comment: '不良品描述',
    type: DataType.STRING,
  })
  declare desc: string

  @Column({
    comment: '不良品数量',
    type: DataType.INTEGER,
  })
  declare count: number

  @Column({
    comment: '不良品处理建议',
    type: DataType.STRING,
  })
  declare handle: string

  @Column({
    comment: '是否开启评审',
    type: DataType.BOOLEAN,
  })
  declare isReview: boolean

  @Column({
    comment: '评审建议',
    type: DataType.STRING,
  })
  declare review: string

  @Column({
    comment: '判定结果',
    type: DataType.STRING,
  })
  declare result: string

  @ForeignKey(() => Process)
  @Column({
    comment: '返工,工序id',
    type: DataType.INTEGER,
  })
  declare processId: number
}
