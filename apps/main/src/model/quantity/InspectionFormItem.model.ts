import { Column, DataType, ForeignKey, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { InspectionFormInfo } from '@model/quantity/inspectionFormInfo.model'

/** 报工检验单检验项目 */
@Table({ tableName: `quantity_inspection_form_item`, freezeTableName: true, timestamps: true, comment: '报工检验单检验项目' })
export class InspectionFormItem extends BaseDate<InspectionFormItem> {
  @ForeignKey(() => InspectionFormInfo)
  @Column({
    comment: '检验单物料明细Id',
    type: DataType.INTEGER,
    allowNull: false, // 必填项
  })
  declare inspectionFormInfoId: number

  @Column({
    comment: '名称',
    type: DataType.STRING(50),
  })
  declare name: string

  @Column({
    comment: 'JSON数据',
    type: DataType.TEXT,
  })
  declare data: string
}
