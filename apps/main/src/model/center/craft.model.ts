import { Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'

/** 工艺 */
@Table({ tableName: `center_craft`, freezeTableName: true, timestamps: true, comment: '工艺' })
export class Craft extends BaseDate<Craft> {
  // 标准属性
  @Column({
    comment: '物料编码',
    type: DataType.STRING(50),
    allowNull: true, // 忽略时自动生成
  })
  declare code: string

  @Column({
    comment: '层级',
    type: DataType.INTEGER,
  })
  declare level: number

  @Column({
    comment: '物料名称',
    type: DataType.STRING(128),
    allowNull: true, // 必填项
  })
  declare name: string

  @Column({
    comment: '图号',
    type: DataType.TEXT,
  })
  declare k3DrawingNo: string

  @Column({
    comment: '图纸版本号',
    type: DataType.STRING,
  })
  declare k3DrawingNoVersion: string

  @Column({
    comment: '零件名称',
    type: DataType.STRING,
  })
  declare partName: string

  @Column({
    comment: '单台用量',
    type: DataType.INTEGER,
  })
  declare dosage: number

  @Column({
    comment: '物料分组',
    type: DataType.STRING,
  })
  declare group: string

  @Column({
    comment: '规格',
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare spec: string

  @Column({
    comment: '单重',
    type: DataType.STRING(50),
  })
  declare singleWeight: string

  @Column({
    comment: '总重',
    type: DataType.STRING(50),
  })
  declare totalWeight: string

  @Column({
    comment: '备注',
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remark: string

  @Column({
    comment: '零件类型',
    type: DataType.STRING(64),
  })
  declare partType: string

  @Column({
    comment: '型号',
    type: DataType.STRING(64),
  })
  declare model: string

  @Column({
    comment: '长',
    type: DataType.STRING(64),
  })
  declare length: string

  @Column({
    comment: '宽',
    type: DataType.STRING(64),
  })
  declare wide: string

  @Column({
    comment: '厚',
    type: DataType.STRING(64),
  })
  declare thick: string

  @Column({
    comment: '材质',
    type: DataType.STRING(64),
  })
  declare material: string

  @Column({
    comment: '备注2',
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remark2: string

  @ForeignKey(() => Craft)
  @Column({
    comment: '上级id',
    type: DataType.INTEGER,
  })
  declare superiorId: number

  @HasMany(() => Craft)
  declare children: Craft[]
  //---------------
}
