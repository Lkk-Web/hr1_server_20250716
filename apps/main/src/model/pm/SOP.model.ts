import { BelongsTo, BelongsToMany, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Material } from '@model/base/material.model'
import { User } from '@model/sys/user.model'
import { FileList } from '@model/dm/FileList.model'
import { Process } from '@model/pm/process.model'
import { SOPMaterial } from '@model/pm/SOPMaterial.model'
import { SOPFile } from '@model/pm/SOPFile.model'

@Table({ tableName: 'pm_sop', freezeTableName: true, timestamps: true, comment: '作业指导书' })
export class SOP extends BaseDate<SOP> {
  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    comment: 'SOP编码',
  })
  declare code: string

  @ForeignKey(() => Process)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '工序Id',
  })
  declare processId: number

  @Column({
    comment: '状态',
    type: DataType.BOOLEAN,
    allowNull: false, // 可选
    defaultValue: true, // 默认值
  })
  declare status: boolean

  @Column({
    comment: '备注',
    type: DataType.TEXT,
    allowNull: true, // 非必填
  })
  declare remark: string

  @BelongsTo(() => Process)
  process: Process

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
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

  @BelongsTo(() => User, 'createdUserId')
  createdUser: User

  @BelongsTo(() => User, 'updatedUserId')
  updatedUser: User

  @BelongsToMany(() => Material, { through: () => SOPMaterial, uniqueKey: 'SOP_sopm_material_unique', foreignKey: 'sopId', otherKey: 'materialId' })
  materials: Material[]

  @BelongsToMany(() => FileList, { through: () => SOPFile, uniqueKey: 'SOP_sopf_fileList_unique', foreignKey: 'sopId', otherKey: 'fileListId' })
  fileList: FileList[]

  @HasMany(() => SOPMaterial)
  declare sopMaterial: SOPMaterial[]

  @HasMany(() => SOPFile)
  declare SOPFiles: SOPFile[]
}
