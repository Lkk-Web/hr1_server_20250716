import { BaseDate } from '@model/shared/baseDate'
import { Column, DataType, Table } from 'sequelize-typescript'

/** 第三方图纸 */
@Table({
  tableName: `io_drawing`, freezeTableName: true, timestamps: true, comment: '中台通知',
  indexes: [
    {
      name: 'idx_key',
      unique: true,
      fields: ['key'],
    },
  ],
})
export class Drawing extends BaseDate<Drawing> {
  @Column({
    comment: '查询key',
    type: DataType.STRING(64),
    allowNull: false,
  })
  declare key: string

  @Column({
    comment: '文件名称',
    type: DataType.STRING,
    allowNull: false,
  })
  declare fileName: string

  @Column({
    comment: '拼接的url',
    type: DataType.TEXT,
    allowNull: false,
  })
  declare url: string
}
