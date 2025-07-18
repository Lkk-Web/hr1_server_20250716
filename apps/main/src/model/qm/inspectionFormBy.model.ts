import { Column, DataType, ForeignKey, Table } from 'sequelize-typescript'
import { User } from '@model/sys/user.model'
import { BaseModel } from '@model/shared/base.model'
import { InspectionForm } from '@model/qm/inspectionForm.model'

/** 报工检验单质检人 */
@Table({ tableName: `qm_inspection_form_by`, freezeTableName: true, timestamps: false, comment: '报工检验单质检人' })
export class InspectionFormBy extends BaseModel<InspectionFormBy> {

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '质检人',
  })
  declare inspectorId: number

  @ForeignKey(() => InspectionForm)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '报工检验单',
  })
  declare inspectionFormId: number



}
