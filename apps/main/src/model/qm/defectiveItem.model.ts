import { Table, Column, Model, DataType } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
/** 不良品项 */
@Table({ tableName: `qm_defective_item`, freezeTableName: true, timestamps: true, comment: '不良品项表' })
export class DefectiveItem extends BaseDate<DefectiveItem> {
  @Column({
    comment: '编码',
    type: DataType.STRING(50),
    allowNull: true, // 忽略时自动生成
  })
  declare code: string
  //
  // // 不良品项分类
  // @Column({
  //   comment: '不良品项分类',
  //   type: DataType.STRING(128),
  //   allowNull: true, // 可选
  // })
  // declare category: string;

  // 不良品项名称：必填项
  @Column({
    comment: '不良品项名称',
    type: DataType.STRING(128),
    allowNull: false, // 必填
  })
  declare name: string

  @Column({
    comment: '自定义字段的数据（JSON格式）',
    type: DataType.TEXT,
  })
  declare formData: string
}
