import { Table, Column, Model, PrimaryKey, AutoIncrement, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/auth/user.model'
import { FileList } from '@model/document/FileList.model'

@Table({ tableName: `document_file_version`, timestamps: true, paranoid: true })
export class FileVersion extends BaseDate<FileVersion> {
  @ForeignKey(() => FileList)
  @Column({ type: DataType.INTEGER, comment: '文件ID' })
  declare fileListId: number

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, comment: '审核人ID' })
  declare auditUserId: number

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, comment: '修改人ID' })
  declare updateUserId: number

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, comment: '创建人ID' })
  declare createUserId: number

  @Column({ type: DataType.STRING, comment: '文件名称' })
  declare name: string

  @Column({ type: DataType.STRING, comment: '版本号' })
  declare versionCode: string

  @Column({ type: DataType.TEXT, comment: '版本描述' })
  declare describe: string

  @Column({ type: DataType.STRING, comment: '文件路径' })
  declare url: string

  @Column({ type: DataType.DATE, comment: '审核时间' })
  declare auditedAt: Date

  @BelongsTo(() => User, 'createUserId')
  declare createdUser: User

  @BelongsTo(() => User, 'updateUserId')
  declare updateUser: User
}
