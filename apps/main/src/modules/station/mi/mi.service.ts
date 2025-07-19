import { PLATFORM } from '@common/enum'
import { CryptoUtil, jwtEncodeInExpire } from '@library/utils/crypt.util'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import { OrgDto, PadLoginDto, PadTeamListDto, ProcessDto, TeamLoginDto, UserPasswordLoginDto } from './mi.dto'
import { SuperRedis } from '@sophons/redis'
import { RedisProvider } from '@library/redis'
import { Process } from '@model/process/process.model'
import { Organize, Team, User } from '@model/index'
import { Includeable } from 'sequelize/types/model'

// const client = new Core({ // 创建 Client 对象
//   accessKeyId: AliSmsInfo.accessKeyId, // 替换成自己的 AccessKey ID
//   accessKeySecret: AliSmsInfo.secretAccessKey, // 替换成自己的 AccessKey Secret
//   endpoint: 'https://dysmsapi.aliyuncs.com', // API 访问入口，根据实际情况修改
//   apiVersion: '2017-05-25', // API 版本号，根据实际情况修改

// })

interface LoginDto {}

@Injectable()
export class MiService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: SuperRedis
  ) {}
  async padLogin(dto: PadLoginDto) {
    //根据部门id及工序id获取登录token
    let org = await Organize.findOne({
      where: {
        id: dto.orgId, //工序id
      },
      attributes: ['id', 'name'],
      include: [
        {
          association: 'process',
          attributes: ['id', 'processName'],
          where: {
            id: dto.processId,
          },
          required: false,
          through: { attributes: [] },
        },
      ],
    })
    if (!org) {
      throw new HttpException('工序对应部门不存在', 400)
    }
    let token = jwtEncodeInExpire({
      platform: PLATFORM.station,
      processId: dto.processId,
      orgId: dto.orgId,
    })
    return token
  }

  async teamLogin(dto: UserPasswordLoginDto) {
    const user = await User.findOne({
      where: {
        userCode: dto.userCode,
      },
      attributes: ['id', 'password'],
    })
    if (!user) {
      throw new HttpException('用户不存在', 400)
    }

    if (user.password !== CryptoUtil.sm4Encryption(dto.password)) {
      throw new HttpException('密码错误', 400)
    }
    const team = await Team.findOne({
      where: {
        id: dto.teamId,
      },
      attributes: ['id', 'name', 'status'],
      include: [
        { association: 'teamProcess', attributes: ['id'], where: { processId: dto.processId } },
        { association: 'teamUser', attributes: [], where: { userId: user.id } },
      ],
    })
    if (!team) {
      throw new HttpException('班组或工序不存在', 400)
    }
    let token = jwtEncodeInExpire({
      platform: PLATFORM.station,
      processId: dto.processId,
      teamId: dto.teamId,
      id: user.id,
    })
    return token
  }

  //切换班组或工序
  async switchTeam(dto: TeamLoginDto, userId: number) {
    const team = await Team.findOne({
      where: {
        id: dto.teamId,
      },
      attributes: ['id', 'name', 'status'],
      include: [
        { association: 'teamProcess', attributes: ['id'], where: { processId: dto.processId } },
        { association: 'teamUser', attributes: [], where: { userId } },
      ],
    })
    if (!team) {
      throw new HttpException('班组或工序不存在', 400)
    }

    return jwtEncodeInExpire({
      platform: PLATFORM.station,
      processId: dto.processId,
      teamId: dto.teamId,
      id: userId,
    })
  }

  async getProcess(dto: ProcessDto) {
    //查询所有工序，如果有部门id则根据部门id查询
    let options = {
      attributes: ['id', 'processName'],
      include: [],
    }
    if (dto.orgId) {
      options.include.push({
        association: 'processDeptList',
        attributes: ['id'],
        where: { deptId: dto.orgId },
      })
    }
    if (dto.teamId) {
      options.include.push({
        association: 'teamProcess',
        attributes: ['id'],
        where: { teamId: dto.teamId },
      })
    }

    let process = await Process.findAll(options)
    return process
  }

  async getOrg(dto: OrgDto) {
    //查询所有部门，如果有工序id则根据工序id查询
    let options = {
      attributes: ['id', 'name'],
      where: {
        attr: '基本生产部门',
      },
      include: [
        {
          association: 'process',
          attributes: ['id', 'processName'],
          where: {},
          required: true,
          through: { attributes: [] },
        },
      ],
    }
    if (dto.processId) {
      options.include[0].where = {
        id: dto.processId,
      }
      options.include[0].required = true
    }
    let sysOrg = await Organize.findAll(options)

    return sysOrg
  }

  //获取班组
  public async getTeam(dto: PadTeamListDto) {
    const include: Includeable[] = []
    if (dto.userCode) {
      const user = await User.findOne({
        where: { userCode: dto.userCode },
        attributes: ['id'],
      })
      if (!user) return []
      include.push({ association: 'teamUsers', attributes: [], where: { userId: user.id } })
    }
    return Team.findAll({
      attributes: ['id', 'name', 'type'],
      include,
    })
  }
}
