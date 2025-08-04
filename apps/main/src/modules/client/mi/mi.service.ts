import { PLATFORM } from '@common/enum'
import { CryptoUtil, jwtEncodeInExpire } from '@library/utils/crypt.util'
import { User } from '@model/auth/user'
import { HttpException, Injectable } from '@nestjs/common'
import { changeFactoryDto, FindPaginationDto, OrderProgressDto, performanceDto, ScheduleFindPaginationDto, taskBoardDto, taskProgressDto, UserLoginDto } from './mi.dto'
import { Aide } from '@library/utils/aide'
import * as process from 'node:process'
import { ProductionReport } from '@model/production/productionReport.model'
import { Op, Sequelize } from 'sequelize'
import { Organize } from '@model/auth/organize'
import { ProcessTask } from '@model/production/processTask.model'
import { ProductionOrder } from '@model/production/productionOrder.model'
import { Performance } from '@model/performance/performance.model'
import { PRI } from '@model/production/PRI.model'
import { Pagination } from '@common/interface'
import { FindPaginationOptions } from '@model/shared/interface'
import { PerformanceDetailed, Process, ReportUser } from '@model/index'
import axios from 'axios'
import E from '@common/error'
import moment = require('moment')

@Injectable()
export class MiService {
  constructor() {}

  async login(dto: UserLoginDto) {
    let user: User = await User.findOne({ where: { userCode: dto.userCode } })
    if (!user) {
      throw E.USER_NOT_EXISTS
    } else if (CryptoUtil.sm4Encryption(dto.password) != user.password) {
      throw E.INVALID_PASSWORD
    }

    // let menuList = STRUtil.buildMenuTree(JSON.parse(JSON.stringify(user.role.menuList)))
    // let users = JSON.parse(JSON.stringify(user))
    // delete users.role.menuList
    // users['menuList'] = menuList
    return {
      token: jwtEncodeInExpire({
        platform: PLATFORM.client,
        id: user.id,
      }),
      user,
    }
  }

  public async getInfo(user: User) {
    return User.findOne({
      where: { id: user.id },
      include: [{ association: 'role', attributes: ['name'] }],
    })
  }

  // 计算员工绩效排名的函数
  async calculateEmployeePerformance(ids, startOfToday, endOfToday, pagination: Pagination) {
    try {
      const whereConditions = {
        endTime: {
          [Op.between]: [startOfToday, endOfToday],
        },
        ...(ids && ids.length > 0 && { productUserId: { [Op.in]: ids } }), // 仅在 ids 存在且非空时添加 productUserId 条件
      }

      const rankings = await ProductionReport.findAll({
        attributes: ['id', 'reportQuantity', 'estimatedWage'],
        where: whereConditions,
      })
      //根据报工id查询生产员工
      const reportId = rankings.map(record => record.id)
      const reportUsers = await ReportUser.findAll({
        where: {
          productionReportId: reportId,
        },
        include: [{ association: 'userDuration', attributes: ['userId'] }],
      })
      //根据userID查询用户
      const userIds = reportUsers.map(record => record.userDuration.userId)
      const users = await User.findAll({
        where: {
          id: userIds,
        },
        attributes: ['id', 'userName'],
      })

      const datas: {
        userId: number
        rank: number
        userName: string
        reportQuantity: number
        estimatedWage: number
      }[] = []
      //归类
      reportUsers.forEach(temp => {
        const ranking = rankings.find(item => item.id === temp.productionReportId)
        const data = datas.find(v => v.userId == temp.userDuration.userId)
        if (!data) {
          datas.push({
            userId: temp.userDuration.userId,
            rank: 0,
            userName: users.find(v => v.id == temp.userDuration.userId)?.userName || '人员不存在',
            reportQuantity: ranking.reportQuantity,
            estimatedWage: ranking.estimatedWage,
          })
        } else {
          data.reportQuantity += ranking.reportQuantity
          data.estimatedWage += ranking.estimatedWage
        }
      })
      //排序
      datas.sort((a, b) => {
        if (a.reportQuantity === b.reportQuantity) {
          return a.estimatedWage - b.estimatedWage // 如果 estimatedWage 相同，则按 reportQuantity 升序排序
        }
        return b.reportQuantity - a.reportQuantity // 按 estimatedWage 降序排序
      })
      datas.forEach((v, i) => {
        v.rank = i + 1
      })
      const result = Aide.diyPaging(datas, pagination)

      return result
    } catch (error) {
      console.error('计算员工绩效排名时出错:', error)
    }
  }

  async getTeamProductionStatistics(startOfToday, endOfToday, pagination: Pagination) {
    try {
      // 获取所有班组信息
      const teams = await Organize.findAll({
        attributes: ['id', 'name'], // 假设 'shortName' 是班组的名称
        include: [
          {
            association: 'processTasks',
            through: { as: 'depts' }, // 修复此处，直接使用模型类名
            attributes: [],
          },
        ],
      })

      const statistics = []

      for (const team of teams) {
        // 获取该班组下所有的工序任务
        const tasks = await ProcessTask.findAll({
          where: {
            createdAt: {
              [Op.between]: [startOfToday, endOfToday],
            },
          },
          attributes: [
            [Sequelize.fn('SUM', Sequelize.col('planCount')), 'totalPlanCount'],
            [Sequelize.fn('SUM', Sequelize.col('goodCount')), 'totalGoodCount'],
          ],
          include: [
            {
              association: 'depts',
              where: { id: team.id }, // 匹配班组
              attributes: [],
              through: { attributes: [] }, // 只需指定空的属性
            },
          ],
          group: ['id'],
        })

        if (tasks && tasks.length > 0) {
          // @ts-ignore
          const { totalPlanCount, totalGoodCount } = tasks[0].dataValues
          if (totalPlanCount > 0) {
            statistics.push({
              teamName: team.name,
              planCount: totalPlanCount || 0,
              goodCount: totalGoodCount || 0,
            })
          }
        }
      }

      console.log('班组生产统计数据:', statistics)
      return statistics
    } catch (error) {
      console.error('获取班组生产统计数据时出错:', error)
    }
  }

  public async board(type: string, user, dto: FindPaginationDto, pagination: Pagination) {
    let startOfToday
    let endOfToday
    if (type === '今天') {
      startOfToday = moment().startOf('day').toDate() // 今天的开始时间
      endOfToday = moment().endOf('day').toDate() // 今天的结束时间
    } else if (type === '本月') {
      startOfToday = moment().startOf('month').toDate() // 本月的开始时间
      endOfToday = moment().endOf('month').toDate() // 本月的结束时间
    } else if (type === '上月') {
      startOfToday = moment().subtract(1, 'months').startOf('month').toDate() // 本月的开始时间
      endOfToday = moment().subtract(1, 'months').endOf('month').toDate() // 本月的结束时间
    }
    //工单数量
    const order = await ProductionOrder.count({
      where: {
        createdAt: {
          [Op.between]: [startOfToday, endOfToday],
        },
      },
    })
    //任务数量
    const task = await ProcessTask.count({
      where: {
        createdAt: {
          [Op.between]: [startOfToday, endOfToday],
        },
      },
    })
    //汇报数量
    const reports = await ProductionReport.count({
      where: {
        createdAt: {
          [Op.between]: [startOfToday, endOfToday],
        },
      },
    })
    //累积预计工资
    const performance = await Performance.sum('wages', {
      where: {
        createdAt: {
          [Op.between]: [startOfToday, endOfToday],
        },
      },
    })
    //累积良品数
    const goodCount = await Performance.sum('goodCount', {
      where: {
        createdAt: {
          [Op.between]: [startOfToday, endOfToday],
        },
      },
    })
    //累积不良品数
    const badCount = await Performance.sum('badCount', {
      where: {
        createdAt: {
          [Op.between]: [startOfToday, endOfToday],
        },
      },
    })
    //不良品率
    const rat = goodCount + badCount !== 0 ? badCount / (goodCount + badCount) : 0
    //员工绩效排名
    const user1 = await User.findByPk(user.id)
    let ids = []
    if (user1.roleId === 3) {
    } else if (user1.roleId === 4) {
      const users = await User.findAll({ where: { departmentId: user1.departmentId } })
      for (const user2 of users) {
        ids.push(user2.id)
      }
    }
    const top = await this.calculateEmployeePerformance(ids, startOfToday, endOfToday, pagination)
    //班组产能统计
    const capacity = await this.getTeamProductionStatistics(startOfToday, endOfToday, pagination)

    return { order, task, reports, performance, rat, top, capacity }
  }

  public async schedule(type: string, user: User, dto: ScheduleFindPaginationDto) {
    let startOfToday
    let endOfToday
    if (type === '今天') {
      startOfToday = moment().startOf('day').toDate() // 今天的开始时间
      endOfToday = moment().endOf('day').toDate() // 今天的结束时间
    } else if (type === '本月') {
      startOfToday = moment().startOf('month').toDate() // 本月的开始时间
      endOfToday = moment().endOf('month').toDate() // 本月的结束时间
    } else if (type === '上月') {
      startOfToday = moment().subtract(1, 'months').startOf('month').toDate() // 本月的开始时间
      endOfToday = moment().subtract(1, 'months').endOf('month').toDate() // 本月的结束时间
    }

    //工单进度
    const orderPagination: Pagination = {
      current: dto.orderCurrent ? dto.orderCurrent : 1,
      pageSize: dto.orderPageSize ? dto.orderPageSize : 10,
    }
    const option: FindPaginationOptions = {
      where: {
        createdAt: {
          [Op.between]: [startOfToday, endOfToday],
        },
      },
      pagination: orderPagination,
      attributes: ['id', 'code', 'bomId', 'status', 'plannedOutput', 'actualOutput'],
      include: [
        {
          association: 'bom',
          attributes: ['id', 'materialId', 'parentId', 'remark', 'version', 'quantity', 'formData'],
          include: [
            {
              association: 'parentMaterial',
              attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
            },
          ],
        },
      ],
    }
    const order = await ProductionOrder.findPagination<ProductionOrder>(option)

    const defectiveItems = await PRI.findAll({
      where: {
        count: {
          [Op.not]: 0,
        },
        createdAt: {
          [Op.between]: [startOfToday, endOfToday],
        },
      },
      attributes: [
        [Sequelize.fn('sum', Sequelize.col('count')), 'totalCount'], // 汇总总数
        'defectiveItem.name', // 按名称分组
      ],
      include: [
        {
          association: 'defectiveItem',
          attributes: [], // 避免重复返回不必要的数据
        },
      ],
      group: ['defectiveItem.name'], // 按不良品项名称分组
      raw: true, // 将结果格式化为简单的 JSON 对象
    })

    return { order, defectiveItems }
  }

  public async taskBoard(type: string, user: User, dto: taskBoardDto) {
    let startOfToday
    let endOfToday
    if (type === '今天') {
      startOfToday = moment().startOf('day').toDate() // 今天的开始时间
      endOfToday = moment().endOf('day').toDate() // 今天的结束时间
    } else if (type === '本月') {
      startOfToday = moment().startOf('month').toDate() // 本月的开始时间
      endOfToday = moment().endOf('month').toDate() // 本月的结束时间
    } else if (type === '上月') {
      startOfToday = moment().subtract(1, 'months').startOf('month').toDate() // 本月的开始时间
      endOfToday = moment().subtract(1, 'months').endOf('month').toDate() // 本月的结束时间
    }

    const taskPagination: Pagination = {
      current: dto.taskCurrent ? dto.taskCurrent : 1,
      pageSize: dto.taskPageSize ? dto.taskPageSize : 10,
    }
    const options: FindPaginationOptions = {
      where: {},
      pagination: taskPagination,
      attributes: ['id', 'processName'],
      include: [
        {
          association: 'tasks',
          attributes: ['planCount', 'goodCount', 'badCount'], // 获取工序名称
          where: {
            createdAt: {
              [Op.between]: [startOfToday, endOfToday],
            },
          },
        },
      ],
    }

    const task = await Process.findPagination<Process>(options)
    task.data = task.data.map(item => {
      item = item.toJSON()
      item['totalPlanCount'] = item.tasks.reduce((acc, task) => acc + (Number(task.planCount) || 0), 0) // 确保计划数为数字
      item['totalGoodCount'] = item.tasks.reduce((acc, task) => acc + (Number(task.goodCount) || 0), 0)
      item['totalBadCount'] = item.tasks.reduce((acc, task) => acc + (Number(task.badCount) || 0), 0)
      delete item.tasks
      return item
    })
    return task
  }

  public async performance(type, user, dto: performanceDto) {
    if (!user) throw new HttpException('登录信息异常,请重新登录', 400)
    let startOfToday
    let endOfToday
    if (type === '今天') {
      startOfToday = moment().startOf('day').toDate() // 今天的开始时间
      endOfToday = moment().endOf('day').toDate() // 今天的结束时间
    } else if (type === '本月') {
      startOfToday = moment().startOf('month').toDate() // 本月的开始时间
      endOfToday = moment().endOf('month').toDate() // 本月的结束时间
    } else if (type === '上月') {
      startOfToday = moment().subtract(1, 'months').startOf('month').toDate() // 本月的开始时间
      endOfToday = moment().subtract(1, 'months').endOf('month').toDate() // 本月的结束时间
    }
    const pagination: Pagination = {
      current: dto.current ? dto.current : 1,
      pageSize: dto.pageSize ? dto.pageSize : 10,
    }

    if (dto.types === 'self') {
      const user1 = await User.findByPk(user.id)

      //工资总计
      const allPerformance = await ProductionReport.sum('estimatedWage', {
        where: {
          createdAt: {
            [Op.between]: [startOfToday, endOfToday],
          },
          productUserId: {
            [Op.eq]: user1.dataValues.id,
          },
        },
      })
      //审核/总计
      const audit = await ProductionReport.findAll({
        where: {
          createdAt: {
            [Op.between]: [startOfToday, endOfToday],
          },
          auditStatus: {
            [Op.eq]: '已审核',
          },
        },
        include: [
          {
            association: 'order',
            attributes: ['id', 'code', 'plannedOutput'],
            include: [
              {
                association: 'bom',
                attributes: ['id', 'materialId', 'parentId', 'remark', 'version', 'quantity'],
                where: {},
                include: [
                  {
                    association: 'parentMaterial',
                    attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
                    where: {},
                  },
                ],
              },
            ],
          },
          {
            association: 'process',
            attributes: ['id', 'processName'],
          },
          {
            association: 'productUser',
            attributes: ['id', 'userCode', 'userName', 'departmentId'],
            where: { id: { [Op.eq]: user1.dataValues.id } },
          },
        ],
      })
      const all = await ProductionReport.findAll({
        where: {
          createdAt: {
            [Op.between]: [startOfToday, endOfToday],
          },
          productUserId: {
            [Op.eq]: user1.dataValues.id,
          },
        },
      })

      //良品
      const goodCount = await ProductionReport.sum('goodCount', {
        where: {
          createdAt: {
            [Op.between]: [startOfToday, endOfToday],
          },
          productUserId: {
            [Op.eq]: user1.dataValues.id,
          },
        },
      })
      //不良品
      const badCount = await ProductionReport.sum('badCount', {
        where: {
          createdAt: {
            [Op.between]: [startOfToday, endOfToday],
          },
          productUserId: {
            [Op.eq]: user1.dataValues.id,
          },
        },
      })
      //总数
      const total = goodCount + badCount
      //合格率
      const yieldRate = goodCount / (goodCount + badCount)

      //未审核
      const unAudit = await ProductionReport.findAll({
        where: {
          createdAt: {
            [Op.between]: [startOfToday, endOfToday],
          },
          auditStatus: {
            [Op.eq]: '未审核',
          },
        },
        include: [
          {
            association: 'order',
            attributes: ['id', 'code', 'plannedOutput'],
            include: [
              {
                association: 'bom',
                attributes: ['id', 'materialId', 'parentId', 'remark', 'version', 'quantity'],
                where: {},
                include: [
                  {
                    association: 'parentMaterial',
                    attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
                    where: {},
                  },
                ],
              },
            ],
          },
          {
            association: 'process',
            attributes: ['id', 'processName'],
          },
          {
            association: 'productUser',
            attributes: ['id', 'userCode', 'userName', 'departmentId'],
            where: { id: { [Op.eq]: user1.dataValues.id } },
          },
        ],
      })
      //未审核数量
      const unAuditCount = unAudit.length

      //已审核
      //已审核数量
      const auditedCount = audit.length

      if (dto.status === '已审核') {
        return {
          allPerformance,
          audit: audit.length,
          all: all.length,
          goodCount,
          badCount,
          total,
          yieldRate,
          unAuditCount,
          list: Aide.diyPaging(audit, pagination),
          auditedCount,
        }
      } else {
        return {
          allPerformance,
          audit: audit.length,
          all: all.length,
          goodCount,
          badCount,
          total,
          yieldRate,
          unAuditCount,
          list: Aide.diyPaging(unAudit, pagination),
          auditedCount,
        }
      }
    } else if (dto.types === 'dept') {
      const user1 = await User.findByPk(user.id)

      //工资总计
      const allPerformanceTemp = await PerformanceDetailed.findAll({
        where: {
          createdAt: {
            [Op.between]: [startOfToday, endOfToday],
          },
        },
        include: [
          {
            association: 'user',
            attributes: ['id', 'departmentId'],
            where: { departmentId: { [Op.eq]: user1.dataValues.departmentId } },
          },
        ],
      })
      let allPerformance = 0
      for (const performanceDetailed of allPerformanceTemp) {
        allPerformance += performanceDetailed.dataValues.wages
      }
      //审核/总计
      const audit = await ProductionReport.findAll({
        where: {
          createdAt: {
            [Op.between]: [startOfToday, endOfToday],
          },
          auditStatus: {
            [Op.eq]: '已审核',
          },
        },
        include: [
          {
            association: 'order',
            attributes: ['id', 'code', 'plannedOutput'],
            include: [
              {
                association: 'bom',
                attributes: ['id', 'materialId', 'parentId', 'remark', 'version', 'quantity'],
                where: {},
                include: [
                  {
                    association: 'parentMaterial',
                    attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
                    where: {},
                  },
                ],
              },
            ],
          },
          {
            association: 'process',
            attributes: ['id', 'processName'],
          },
          {
            association: 'productUser',
            attributes: ['id', 'userCode', 'userName', 'departmentId'],
            where: {
              departmentId: {
                [Op.eq]: user1.dataValues.departmentId,
              },
            },
          },
        ],
      })
      const all = await ProductionReport.findAll({
        where: {
          createdAt: {
            [Op.between]: [startOfToday, endOfToday],
          },
        },
        include: [
          {
            association: 'order',
            attributes: ['id', 'code', 'plannedOutput'],
            include: [
              {
                association: 'bom',
                attributes: ['id', 'materialId', 'parentId', 'remark', 'version', 'quantity'],
                where: {},
                include: [
                  {
                    association: 'parentMaterial',
                    attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
                    where: {},
                  },
                ],
              },
            ],
          },
          {
            association: 'process',
            attributes: ['id', 'processName'],
          },
          {
            association: 'productUser',
            attributes: ['id', 'userCode', 'userName', 'departmentId'],
            where: {
              departmentId: {
                [Op.eq]: user1.dataValues.departmentId,
              },
            },
          },
        ],
      })

      //良品
      const goodCountTemp = await ProductionReport.findAll({
        where: {
          createdAt: {
            [Op.between]: [startOfToday, endOfToday],
          },
        },
        include: [
          {
            association: 'productUser',
            attributes: ['id', 'userCode', 'userName', 'departmentId'],
            where: {
              departmentId: {
                [Op.eq]: user1.dataValues.departmentId,
              },
            },
          },
        ],
      })
      let goodCount = 0
      for (const performanceDetailed of goodCountTemp) {
        goodCount += performanceDetailed.dataValues.goodCount
      }
      //不良品

      let badCount = 0
      for (const performanceDetailed of goodCountTemp) {
        badCount += performanceDetailed.dataValues.badCount
      }
      //总数
      const total = goodCount + badCount
      //合格率
      const yieldRate = goodCount / (goodCount + badCount)

      //未审核
      const unAudit = await ProductionReport.findAll({
        where: {
          createdAt: {
            [Op.between]: [startOfToday, endOfToday],
          },
          auditStatus: {
            [Op.eq]: '未审核',
          },
        },
        include: [
          {
            association: 'order',
            attributes: ['id', 'code', 'plannedOutput'],
            include: [
              {
                association: 'bom',
                attributes: ['id', 'materialId', 'parentId', 'remark', 'version', 'quantity'],
                where: {},
                include: [
                  {
                    association: 'parentMaterial',
                    attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
                    where: {},
                  },
                ],
              },
            ],
          },
          {
            association: 'process',
            attributes: ['id', 'processName'],
          },
          {
            association: 'productUser',
            attributes: ['id', 'userCode', 'userName', 'departmentId'],
            where: {
              departmentId: {
                [Op.eq]: user1.dataValues.departmentId,
              },
            },
          },
        ],
      })

      //未审核数量
      const unAuditCount = unAudit.length

      //已审核数量
      const auditedCount = audit.length

      if (dto.status === '已审核') {
        return {
          allPerformance,
          audit: audit.length,
          all: all.length,
          goodCount,
          badCount,
          total,
          yieldRate,
          unAuditCount,
          list: Aide.diyPaging(audit, pagination),
          auditedCount,
        }
      } else {
        return {
          allPerformance,
          audit: audit.length,
          all: all.length,
          goodCount,
          badCount,
          total,
          yieldRate,
          unAuditCount,
          list: Aide.diyPaging(unAudit, pagination),
          auditedCount,
        }
      }
    }
  }

  public async changeFactory(dto: changeFactoryDto, user: User) {
    if (dto.factoryId) {
      console.log(user)
      if (user.id) {
        const user1 = await User.findOne({ where: { id: user.id } })
        const response = await axios.post(
          `${process.env.PLATFORM_PATH}client/v1/mi/changeFactory`,
          {
            phone: user1.phone,
            factoryId: dto.factoryId,
          },
          {
            headers: {
              Authorization: 'Bearer FigphK45sb4eDSsc4q65gs',
            },
          }
        )
        if (response.data) {
          const result = { token: response.data.data.token, url: response.data.data.url }
          return result
        }
      }
    } else {
      throw new HttpException('工厂参数或用户参数缺失,请重新登陆', 400)
    }
  }

  public async home(user) {
    if (!user.id) throw new HttpException('登录信息异常,请重新登录', 400)
    const user1 = await User.findByPk(user.id)
    const [order, task] = await Promise.all([
      ProductionOrder.findAll({
        where: { status: { [Op.not]: '已结束' } },
        attributes: ['id'],
        include: [
          {
            association: 'processes',
            attributes: ['id'],
            where: {},
            include: [
              {
                association: 'depts',
                attributes: ['id'],
                where: {
                  id: {
                    [Op.eq]: user1.dataValues.departmentId,
                  },
                },
              },
            ],
          },
        ],
      }),
      ProcessTask.findAll({
        where: { status: { [Op.not]: '已结束' } },
        include: [
          {
            association: 'users',
            where: {
              id: {
                [Op.eq]: user1.id,
              },
            },
          },
        ],
      }),
    ])
    return { order: order.length, task: task.length }
  }

  async productionStatistics(orders: ProductionOrder[], startTime, endTime) {
    let statistics = []
    for (const order of orders) {
      // const pop = order.dataValues.processes[order.dataValues.processes.length - 1]
      // if (pop && pop.dataValues.processTaskId) {
      let productionCount = 0
      let totalProductionCount = 0
      const report = await ProductionReport.findAll({
        where: {
          processTaskId: {
            // [Op.eq]: pop.dataValues.processTaskId,
          },
          endTime: {
            [Op.between]: [startTime, endTime],
          },
        },
      })
      for (const productionReport of report) {
        console.log(productionReport)
        productionCount += Number(productionReport.dataValues.goodCount)
        totalProductionCount += Number(productionReport.dataValues.reportQuantity)
      }
      //产品名                                                   良品数           总数                  良品率
      statistics.push({
        // name: order.dataValues.bom.dataValues.parentMaterial.materialName,
        productionCount,
        totalProductionCount,
        goodRate: totalProductionCount !== 0 && totalProductionCount != null ? ((productionCount / totalProductionCount) * 100).toFixed(2) : '0.00',
      })
    }
    // }
    return statistics
  }

  public async orderProgress(user, dto: OrderProgressDto) {
    let startTime
    let endTime
    if (dto.timeType === '本月') {
      startTime = moment().startOf('month').format('YYYY-MM-DD HH:mm:ss')
      endTime = moment().endOf('month').format('YYYY-MM-DD HH:mm:ss')
    } else if (dto.timeType === '本周') {
      startTime = moment().startOf('week').format('YYYY-MM-DD HH:mm:ss')
      endTime = moment().endOf('week').format('YYYY-MM-DD HH:mm:ss')
    } else if (dto.timeType === '今天') {
      startTime = moment().startOf('day').format('YYYY-MM-DD HH:mm:ss')
      endTime = moment().endOf('day').format('YYYY-MM-DD HH:mm:ss')
    }
    const orderPagination: Pagination = {
      current: dto.current ? dto.current : 1,
      pageSize: dto.pageSize ? dto.pageSize : 10,
    }
    const option: FindPaginationOptions = {
      where: {
        endTime: {
          [Op.between]: [startTime, endTime],
        },
      },
      pagination: orderPagination,
      attributes: ['id', 'code', 'bomId', 'status', 'plannedOutput', 'actualOutput', 'startTime', 'endTime'],
      include: [
        {
          association: 'bom',
          attributes: ['id', 'materialId', 'parentId', 'remark', 'version', 'quantity', 'formData'],
          include: [
            {
              association: 'parentMaterial',
              attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
            },
          ],
        },
      ],
    }
    const order = await ProductionOrder.findPagination<ProductionOrder>(option)
    return order
  }

  public async salary(user, dto: OrderProgressDto) {
    let startTime
    let endTime
    if (dto.timeType === '本月') {
      startTime = moment().startOf('month').format('YYYY-MM-DD HH:mm:ss')
      endTime = moment().endOf('month').format('YYYY-MM-DD HH:mm:ss')
    } else if (dto.timeType === '本周') {
      startTime = moment().startOf('week').format('YYYY-MM-DD HH:mm:ss')
      endTime = moment().endOf('week').format('YYYY-MM-DD HH:mm:ss')
    } else if (dto.timeType === '今天') {
      startTime = moment().startOf('day').format('YYYY-MM-DD HH:mm:ss')
      endTime = moment().endOf('day').format('YYYY-MM-DD HH:mm:ss')
    }
    const pagination: Pagination = {
      current: dto.current ? dto.current : 1,
      pageSize: dto.pageSize ? dto.pageSize : 10,
    }
    if (!user) throw new HttpException('登录信息异常', 400)
    const user1 = await User.findByPk(user.id)
    let ids = []
    if (user1.roleId === 3) {
    } else if (user1.roleId === 4) {
      const users = await User.findAll({ where: { departmentId: user1.departmentId } })
      for (const user2 of users) {
        ids.push(user2.id)
      }
    }
    //员工绩效排名
    const top = await this.calculateEmployeePerformance(ids, startTime, endTime, pagination)
    return top
  }

  public async deptProgress(user, dto: taskProgressDto) {
    let startTime
    let endTime
    if (dto.timeType === '本月') {
      startTime = moment().startOf('month').format('YYYY-MM-DD HH:mm:ss')
      endTime = moment().endOf('month').format('YYYY-MM-DD HH:mm:ss')
    } else if (dto.timeType === '本周') {
      startTime = moment().startOf('week').format('YYYY-MM-DD HH:mm:ss')
      endTime = moment().endOf('week').format('YYYY-MM-DD HH:mm:ss')
    } else if (dto.timeType === '今天') {
      startTime = moment().startOf('day').format('YYYY-MM-DD HH:mm:ss')
      endTime = moment().endOf('day').format('YYYY-MM-DD HH:mm:ss')
    }
    const pagination: Pagination = {
      current: dto.current ? dto.current : 1,
      pageSize: dto.pageSize ? dto.pageSize : 10,
    }
    const processes = await ProcessTask.findPagination<ProcessTask>({
      where: {
        endTime: {
          [Op.between]: [startTime, endTime],
        },
      },
      pagination,
      include: [
        {
          association: 'process',
          attributes: ['id', 'processName'],
          where: { id: { [Op.eq]: dto.processId } },
          required: true,
        },
        {
          association: 'order',
          attributes: ['id', 'code', 'bomId', 'startTime', 'endTime'],
          include: [
            {
              association: 'bom',
              attributes: ['id', 'materialId', 'parentId', 'remark', 'version', 'quantity', 'formData'],
              where: {},
              include: [
                {
                  association: 'parentMaterial',
                  attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
                },
              ],
            },
          ],
        },
      ],
    })
    return processes
  }
}
