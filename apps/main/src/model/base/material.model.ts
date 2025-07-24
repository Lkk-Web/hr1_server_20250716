import { BelongsTo, Column, DataType, Default, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { BOM } from '@model/base/bom.model'
import { ProcessRoute } from '@model/process/processRoute.model'
import { ManHour } from '@model/performance/manHour.model'

/** 物料 */
@Table({ tableName: `base_material`, freezeTableName: true, timestamps: true, comment: '物料表' })
export class Material extends BaseDate<Material> {
  // 标准属性
  @Column({
    comment: '物料编码',
    type: DataType.STRING(50),
    allowNull: true, // 忽略时自动生成
  })
  declare code: string
  @Column({
    comment: '物料属性',
    type: DataType.STRING(50),
    allowNull: true,
    defaultValue: '自制', // 默认为自制
  })
  declare attribute: string

  @Column({
    comment: '物料类别',
    type: DataType.STRING(50),
    allowNull: true,
    defaultValue: '成品',
  })
  declare category: string
  @Column({
    comment: '物料名称',
    type: DataType.STRING(128),
    allowNull: true, // 必填项
  })
  declare materialName: string

  @Column({
    comment: '物料规格',
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare spec: string
  @Column({
    comment: '单位',
    type: DataType.STRING(50),
    allowNull: true,
  })
  declare unit: string
  @Default(true)
  @Column({
    comment: '状态（启用/禁用）',
    type: DataType.BOOLEAN,
  })
  declare status: boolean
  @Column({
    comment: '备注',
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remark: string
  @Column({
    comment: '自定义字段的数据（JSON格式）',
    type: DataType.TEXT,
  })
  declare formData: string

  @Column({
    comment: '数据状态',
    type: DataType.TEXT,
  })
  declare k3DataStatus: string

  @Column({
    comment: '启用批号管理',
    type: DataType.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  })
  declare batNumber: boolean
  declare warehouseCount: number

  // 关联属性
  // // TODO 开发者确认
  @ForeignKey(() => ProcessRoute)
  @Column({
    comment: '工艺路线',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare processRouteId: number

  @Column({
    comment: '单件重量',
    type: DataType.FLOAT(8, 2),
  })
  declare unitWeight: number

  @Column({
    comment: '重量单位',
    type: DataType.STRING,
  })
  declare unitsWeight: string

  @BelongsTo(() => ProcessRoute)
  declare processRoute: ProcessRoute

  @HasMany(() => ManHour)
  declare manHours: ManHour[]

  @HasMany(() => BOM)
  declare boms: BOM[]

  //---------------
  declare manHour: ManHour
}
