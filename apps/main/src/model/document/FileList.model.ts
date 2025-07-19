import { BelongsTo, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { FileMenu } from '@model/document/FileMenu.model'
import { Organize } from '@model/auth/organize'
import { User } from '@model/auth/user.model'
import { FileVersion } from '@model/document/FileVersion.model'

@Table({ tableName: `document_file_list`, timestamps: true, paranoid: true })
export class FileList extends BaseDate<FileList> {
  @Column({ type: DataType.STRING, comment: '文件名称' })
  declare name: string

  @ForeignKey(() => FileMenu)
  @Column({ type: DataType.INTEGER, comment: '文件目录ID' })
  declare fileMenuId: number

  @BelongsTo(() => FileMenu, 'fileMenuId')
  declare fileMenu: FileMenu

  @Column({ type: DataType.STRING, comment: '最新版本号' })
  declare versionCode: string

  @Column({ type: DataType.TEXT, comment: '最新文件路径' })
  declare url: string

  @ForeignKey(() => Organize)
  @Column({ type: DataType.INTEGER, comment: '创建组织' })
  declare createdOrgId: number

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, comment: '修改人ID' })
  declare updateUserId: number

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, comment: '创建人ID' })
  declare createUserId: number

  @ForeignKey(() => Organize)
  @Column({ type: DataType.INTEGER, comment: '使用组织' })
  declare useOrgId: number

  @Column({ type: DataType.TEXT, comment: '文件描述' })
  declare describe: string

  @Column({ type: DataType.DATE, comment: '审核时间' })
  declare auditedAt: Date

  declare catalogue: string

  @HasMany(() => FileVersion)
  fileVersionList: FileVersion[]

  @BelongsTo(() => User, 'createUserId')
  declare createdUser: User

  @BelongsTo(() => User, 'updateUserId')
  declare updateUser: User
}
