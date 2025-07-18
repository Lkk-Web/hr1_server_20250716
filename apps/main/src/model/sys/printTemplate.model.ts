import { Table, Column, Model, DataType } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'

@Table({ tableName: `sys_print_templates`, timestamps: true, freezeTableName: true, comment: '打印模板表' })
export class PrintTemplate extends BaseDate<PrintTemplate> {
  @Column({
    comment: '模板名称',
    type: DataType.STRING,
    allowNull: false,
  })
  declare templateName: string

  @Column({
    comment: '模板规格',
    type: DataType.STRING,
    allowNull: false,
  })
  declare templateSize: string

  @Column({
    comment: '备注',
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remark: string

  @Column({
    comment: '二维码内容',
    type: DataType.STRING,
    allowNull: false,
  })
  declare qrCodeContent: string

  @Column({
    comment: '产品编号',
    type: DataType.STRING,
    allowNull: true,
  })
  declare code: string

  @Column({
    comment: '产品名称',
    type: DataType.STRING,
    allowNull: true,
  })
  declare name: string

  @Column({
    comment: '产品规格',
    type: DataType.STRING,
    allowNull: true,
  })
  declare spec: string

  @Column({
    comment: '计划数',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare planCount: number

  @Column({
    comment: '计划时间',
    type: DataType.STRING,
    allowNull: true,
  })
  declare planTime: string

  @Column({
    comment: '备注信息',
    type: DataType.STRING,
    allowNull: true,
  })
  declare notes: string
}
