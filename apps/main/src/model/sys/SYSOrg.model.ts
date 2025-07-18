import { BelongsTo, BelongsToMany, Column, DataType, ForeignKey, HasMany, PrimaryKey, Table } from 'sequelize-typescript'
import { DATA_STATUS } from '@common/constant'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/sys/user.model'
import { ProcessTaskDept } from '@model/pe/processTaskDept.model'
import { ProcessTask } from '@model/pe/processTask.model'
import { Process, ProcessDept } from '..'
// import { UserDepartment } from '@model/userDepartment.model'

@Table({ tableName: `sys_org`, timestamps: true, freezeTableName: true, paranoid: true })
export class SYSOrg extends BaseDate<SYSOrg> {
  @Column({ type: DataType.STRING, comment: '组织名称' })
  declare name: string

  @Column({ type: DataType.STRING, comment: '组织编码' })
  declare code: string

  @Column({ type: DataType.STRING, comment: '组织简称' })
  declare shortName: string

  @Column({ type: DataType.JSON, comment: '经纬度' })
  declare coordinate: any

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW, comment: '创建时间' })
  declare createdAt: Date
  // 地址
  @Column({ type: DataType.STRING, comment: '地址' })
  declare address: string

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW, comment: '更新时间' })
  declare updatedAt: Date

  @ForeignKey(() => SYSOrg)
  @Column({ type: DataType.INTEGER, comment: '父级id' })
  declare parentId: number
  // @Column({ type: DataType.INTEGER, comment: '数据状态' })
  // declare dataStatus: DATA_STATUS;

  @Column({ type: DataType.STRING, comment: '部门属性' })
  declare attr: string

  @Column({ type: DataType.STRING, comment: 'erp Id' })
  declare fid: string

  @Column({ type: DataType.INTEGER, comment: '状态（0禁用 1启用 ）' })
  declare status: number

  @Column({ type: DataType.STRING, comment: '组织类型（公司、部门）' })
  declare types: string

  @Column({ type: DataType.INTEGER, comment: '排序' })
  declare sort: number

  @Column({ type: DataType.STRING, comment: '备注' })
  declare remark: string

  @HasMany(() => User)
  userArray: User[]

  @HasMany(() => SYSOrg)
  declare childOrgs: SYSOrg[]

  // @HasMany(() => UserDepartment)
  // declare deptUsers: UserDepartment[];

  @BelongsToMany(() => ProcessTask, { through: () => ProcessTaskDept, uniqueKey: 'SYSOrg_ptd_pt_unique', foreignKey: 'deptId', otherKey: 'taskId' })
  processTasks: ProcessTask[]
  //     foreignKey

  @BelongsToMany(() => Process, { through: () => ProcessDept, uniqueKey: 'so_process_pd_unique', foreignKey: 'deptId', otherKey: 'processId' })
  process: Process[]
  //部门员工人数
  declare count: number
}
