import { User } from '@model/auth/user.model'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import { changeFactoryDto, OrderProgressDto, RoleBoardDto, taskProgressDto } from './mi.dto'
import axios from 'axios'
import { HttpService } from '@nestjs/axios'
import { SuperRedis } from '@sophons/redis'
import { RedisProvider } from '@library/redis'
import * as process from 'node:process'
import { ProductionOrder } from '@model/production/productionOrder.model'
import { col, fn, Op } from 'sequelize'
import { ProcessTask } from '@model/production/processTask.model'
import { ProductionReport } from '@model/production/productionReport.model'
import { PRI } from '@model/production/PRI.model'
import { ResultVO } from '@common/resultVO'
import { Process } from '@model/process/process.model'
import { SalesOrder } from '@model/plan/salesOrder.model'
import { Pagination } from '@common/interface'
import { OutboundOrder } from '@model/warehouse/outboundOrder.model'
import { EquipmentLedger } from '@model/equipment/equipmentLedger.model'
import { CheckOrder } from '@model/equipment/checkOrder.model'
import { InspectionOrder } from '@model/equipment/inspectionOrder.model'
import { RepairOrder } from '@model/equipment/repairOrder.model'
import { Sequelize } from 'sequelize-typescript'
import { FindPaginationOptions } from '@model/shared/interface'
import { Paging } from '@library/utils/paging'
import { RepairOrderDetail } from '@model/equipment/repairOrderDetail.model'
import { RepairOrderResult } from '@model/equipment/repairOrderResult.model'
import { Aide } from '@library/utils/aide'
import { STRUtil } from '@library/utils/str'
import { ReportUser } from '@model/production/reportUser.model'
import { Menu } from '@model/auth/menu'
import moment = require('moment')

interface LoginDto {}

@Injectable()
export class MiService {
  // private readonly appId: string = process.env.WX_APP_ID
  // private readonly appSecret: string = process.env.WX_APP_SECRET
  private resp
  // 模拟存储二维码的扫码状态
  private qrCodeStatus = {}
  private userScene = {}

  constructor(
    private readonly httpService: HttpService,
    @Inject(RedisProvider.local)
    private readonly redis: SuperRedis
  ) {}

  public async getInfo(user: User, factoryCode, loadModel) {
    let res = {}
    const user1 = await User.findOne({
      where: { id: user.id },
      include: [
        {
          association: 'role',
          attributes: ['id', 'code', 'name', 'dataScopeType'],
          include: [
            {
              association: 'menuList',
              attributes: ['id', 'name', 'parentId', 'url', 'sort', 'types', 'icon', 'perms', 'status'],
              required: false,
              through: { attributes: [] },
            },
          ],
          required: false,
        },
      ],
    })
    let permissions = []
    let users
    // 如果用户是管理员，则返回所有菜单
    if (user1.dataValues.role && user1.dataValues.role.dataValues.code == 'admin') {
      let menuList = await Menu.findAll({
        attributes: ['id', 'name', 'parentId', 'url', 'sort', 'types', 'icon', 'perms', 'status'],
      })
      let newmenuList = STRUtil.buildMenuTree(JSON.parse(JSON.stringify(menuList)))
      users = JSON.parse(JSON.stringify(user1))
      delete users.role.menuList
      users['menuList'] = newmenuList
      permissions = permissions.concat(newmenuList.map(item => item.perms))
    } else {
      if (user1.role && user1?.role?.menuList) {
        let menuList = STRUtil.buildMenuTree(JSON.parse(JSON.stringify(user1.role.menuList)))
        users = JSON.parse(JSON.stringify(user1))
        delete users.role.menuList
        users['menuList'] = menuList
        permissions = permissions.concat(menuList.map(item => item.perms))
      }
    }
    res = {
      user: users ? users : user1,
    }
    return res
  }

  public async changeFactory(dto: changeFactoryDto, user: User, loadModel) {
    if (dto.factoryId) {
      console.log(user)
      if (user.id) {
        const user1 = await User.findOne({ where: { id: user.id } })
        console.log(user1)
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
      } else {
        throw new HttpException('用户参数缺失,请重新登陆', 400)
      }
    } else {
      throw new HttpException('工厂参数缺失,请重新登陆', 400)
    }
  }

  public async PCHome(type: string, user, loadModel) {
    // 获取当前日期对象
    const currentDate = new Date()
    let day = new Date()
    if (type === '7') {
      // 创建最近七天的起始日期
      day.setDate(currentDate.getDate() - 7)
    } else if (type === '30') {
      // 创建最近三十天的起始日期
      day.setDate(currentDate.getDate() - 30)
    } else {
      throw new HttpException('参数错误', 400)
    }
    //工单数量
    const orderCount = await ProductionOrder.findAll({ where: { createdAt: { [Op.gt]: day } } })

    //任务数量
    const taskCount = await ProcessTask.findAll({ where: { createdAt: { [Op.gt]: day } } })

    //报工数量

    const reportCount = await ProductionReport.findAll({ where: { createdAt: { [Op.gt]: day } } })

    //良品数
    const goodCount = await ProductionReport.sum('goodCount', { where: { createdAt: { [Op.gt]: day } } })

    //不良品数
    const badCount = await ProductionReport.sum('badCount', { where: { createdAt: { [Op.gt]: day } } })

    // 1. 生成最近 7 天的完整日期范围
    const startDate = moment(day).startOf('day').add(1, 'day') // 起始日期的 00:00
    const endDate = moment().startOf('day') // 今天的 00:00

    const dateRange: string[] = []
    while (startDate.isBefore(endDate) || startDate.isSame(endDate)) {
      dateRange.push(startDate.format('YYYY-MM-DD'))
      startDate.add(1, 'day') // 日期增加一天
    }

    // 2. 查询任务统计数据
    const taskStatistics = await ProcessTask.findAll({
      attributes: [
        [fn('DATE', col('createdAt')), 'date'], // 按日期分组
        [fn('COUNT', '*'), 'taskCount'], // 统计任务数量
      ],
      where: { createdAt: { [Op.gte]: moment(day).startOf('day').toDate() } },
      group: [fn('DATE', col('createdAt'))],
      order: [[fn('DATE', col('createdAt')), 'ASC']],
      raw: true,
    })

    // 3. 查询报工统计数据
    const reportStatistics = await ProductionReport.findAll({
      attributes: [
        [fn('DATE', col('createdAt')), 'date'],
        [fn('COUNT', '*'), 'reportCount'],
      ],
      where: { createdAt: { [Op.gte]: moment(day).startOf('day').toDate() } },
      group: [fn('DATE', col('createdAt'))],
      order: [[fn('DATE', col('createdAt')), 'ASC']],
      raw: true,
    })

    // 4. 将查询结果映射为 { date: count } 的格式
    const taskMap = taskStatistics.reduce((acc, cur) => {
      // @ts-ignore
      acc[cur.date] = cur.taskCount
      return acc
    }, {} as Record<string, number>)

    const reportMap = reportStatistics.reduce((acc, cur) => {
      // @ts-ignore
      acc[cur.date] = cur.reportCount
      return acc
    }, {} as Record<string, number>)

    // 5. 遍历完整日期范围，补齐缺失数据
    const completeTaskStatistics = dateRange.map(date => ({
      date,
      taskCount: taskMap[date] || 0,
    }))

    const completeReportStatistics = dateRange.map(date => ({
      date,
      reportCount: reportMap[date] || 0,
    }))

    // 查询不良品项分布数据
    const defectiveItemDistribution = await PRI.findAll({
      attributes: [
        'defectiveItemId',
        [fn('SUM', col('count')), 'totalCount'], // 统计每个不良品项的总数量
      ],
      include: [
        {
          attributes: ['name'], // 获取不良品项的名称
          association: 'defectiveItem', // 设置别名，确保关联正确
        },
      ],
      group: ['defectiveItemId', 'defectiveItem.name'], // 使用别名进行分组
      order: [[fn('SUM', col('count')), 'DESC']], // 按数量降序排列
    })

    // 格式化结果以便生成图表

    const defect = defectiveItemDistribution.map(item => ({
      name: item.dataValues.defectiveItem.name,
      // @ts-ignore
      count: item.dataValues.totalCount,
    }))

    // 查询良品数和不良品数，按日期分组
    const reportDataByDate = await ProductionReport.findAll({
      attributes: [
        [fn('DATE', col('createdAt')), 'reportDate'], // 按日期分组
        [fn('SUM', col('goodCount')), 'totalGoodCount'], // 统计良品数量
        [fn('SUM', col('badCount')), 'totalBadCount'], // 统计不良品数量
      ],
      group: [fn('DATE', col('createdAt'))], // 按日期分组
      order: [[fn('DATE', col('createdAt')), 'ASC']], // 按日期排序
    })

    // 格式化结果以便生成图表
    const result = reportDataByDate.map(item => ({
      // @ts-ignore
      date: item.dataValues.reportDate,
      // @ts-ignore
      goodCount: item.dataValues.totalGoodCount,
      // @ts-ignore
      badCount: item.dataValues.totalBadCount,
    }))

    //工序不合格比例
    const ratio = await ProductionReport.findAll({
      attributes: ['processId', [fn('SUM', col('badCount')), 'totalDefects'], [fn('SUM', col('reportQuantity')), 'totalReports']],
      group: ['ProductionReport.processId'],
      include: [
        {
          association: 'process',
          attributes: ['id', 'processName'],
        },
      ],
    })
    console.log(ratio)

    const ratioArray = ratio.map(item => ({
      // @ts-ignore
      processName: item.dataValues.process.dataValues.processName,
      // @ts-ignore
      defectRate: (item.dataValues.totalReports > 0 ? (item.dataValues.totalDefects / item.dataValues.totalReports) * 100 : 0).toFixed(2),
    }))
    return new ResultVO({
      orderCount: orderCount.length,
      taskCount: taskCount.length,
      reportCount: reportCount.length,
      goodCount: goodCount,
      badCount: badCount,
      taskStatistics: completeTaskStatistics,
      reportStatistics: completeReportStatistics,
      defectiveItemDistribution: defect,
      goodCountAndBadCount: result,
      ratioArray,
    })
  }

  async orderDelivery(salesOrder: SalesOrder[], type) {
    if (type == '按时') {
      //按时交付
      let delivered = 0
      let undelivered = 0
      let totalOutCount = 0
      let orders = []
      for (const salesOrder1 of salesOrder) {
        let done = 0
        let notDone = 0
        //订单数量
        let orderCount = 0
        //订单按时交付数量
        let orderOnTimeCount = 0
        for (const detail of salesOrder1.dataValues.details) {
          orderCount += Number(detail.quantity)
          let outCount = 0
          //找出该订单的出货记录
          const outOrder = await OutboundOrder.findAll({
            where: {
              originCode: { [Op.eq]: salesOrder1.code },
            },
            include: [
              {
                association: 'details',
                where: {
                  materialId: { [Op.eq]: detail.materialId },
                },
              },
            ],
          })
          //判断出货数量是否等于订单数量
          for (const outboundOrder of outOrder) {
            for (const detail1 of outboundOrder.dataValues.details) {
              outCount += Number(detail1.count)
            }
          }
          if (outCount == detail.quantity) {
            done++
          } else if (outCount < detail.quantity) {
            notDone++
          }
          totalOutCount += Number(outCount)
          orderOnTimeCount += Number(outCount)
        }
        if (done == salesOrder1.dataValues.details.length) {
          delivered++
        } else if (done < salesOrder1.dataValues.details.length) {
          undelivered++
        }
        orders.push({
          order: salesOrder1.code + '-' + salesOrder1.dataValues.customer.dataValues.fullName,
          orderCount,
          onTimeCount: orderOnTimeCount,
        })
      }
      return { orders, delivered, undelivered, totalOutCount }
    } else if (type == '累积') {
      //累积交付
      let delivered = 0
      let undelivered = 0
      let totalOutCount = 0
      let orders = []
      for (const salesOrder1 of salesOrder) {
        let done = 0
        let notDone = 0
        //订单数量
        let orderCount = 0
        //订单按时交付数量
        let orderAccrueCount = 0
        for (const detail of salesOrder1.dataValues.details) {
          orderCount += Number(detail.quantity)
          let outCount = 0
          //找出该物料所有对该客户的出库记录
          const outOrder = await OutboundOrder.findAll({
            where: {
              originCode: { [Op.eq]: salesOrder1.code },
            },
            include: [
              {
                association: 'details',
                where: {
                  materialId: { [Op.eq]: detail.materialId },
                },
              },
            ],
          })
          //判断出货数量是否等于订单数量
          for (const outboundOrder of outOrder) {
            for (const detail1 of outboundOrder.dataValues.details) {
              outCount += Number(detail1.count)
            }
          }
          if (outCount == detail.quantity) {
            done++
          } else if (outCount < detail.quantity) {
            notDone++
          }
          totalOutCount += Number(outCount)
          orderAccrueCount += Number(outCount)
        }
        if (done == salesOrder1.dataValues.details.length) {
          delivered++
        } else if (done < salesOrder1.dataValues.details.length) {
          undelivered++
        }
        orders.push({
          order: salesOrder1.code + '-' + salesOrder1.dataValues.customer.dataValues.fullName,
          orderCount,
          accrueCount: orderAccrueCount,
        })
      }
      return { orders, delivered, undelivered, totalOutCount }
    }
  }

  async productionStatistics(orders: ProductionOrder[], startTime, endTime) {
    let statistics = []
    for (const order of orders) {
      const pop = order.dataValues.processes[order.dataValues.processes.length - 1]
      if (pop && pop.dataValues.processTaskId) {
        let productionCount = 0
        let totalProductionCount = 0
        const report = await ProductionReport.findAll({
          where: {
            taskId: {
              [Op.eq]: pop.dataValues.processTaskId,
            },
            endTime: {
              [Op.between]: [startTime, endTime],
            },
          },
        })
        for (const productionReport of report) {
          productionCount += Number(productionReport.dataValues.goodCount)
          totalProductionCount += Number(productionReport.dataValues.reportQuantity)
        }
        statistics.push({
          name: order.dataValues.bom.dataValues.parentMaterial.name,
          productionCount,
          totalProductionCount,
          goodRate: totalProductionCount != 0 ? ((Number(productionCount) / Number(totalProductionCount)) * 100).toFixed(2) : '0.00',
        })
      }
    }
    return statistics
  }

  public async roleBoard(dto: RoleBoardDto, user) {
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

    // user = {id : 9}
    if (!user) throw new HttpException('登录信息有误', 400)
    const user1 = await User.findByPk(user.id, { include: [{ association: 'role' }] })

    if (user1 && user1?.role?.name === '总经理') {
      //订单交付统计
      const salesOrder = await SalesOrder.findAll({
        where: {},
        include: [
          {
            association: 'customer',
            attributes: ['id', 'fullName'],
          },
          {
            association: 'details',
            where: {
              deliveryDate: {
                [Op.between]: [startTime, endTime],
              },
            },
          },
        ],
      })
      let totalPlanCount = 0
      for (const salesOrder1 of salesOrder) {
        for (const detail of salesOrder1.dataValues.details) {
          totalPlanCount += Number(detail.quantity)
        }
      }
      const onTime = await this.orderDelivery(salesOrder, '按时')
      const accrue = await this.orderDelivery(salesOrder, '累积')

      // 创建一个 Map 以订单名称为键进行合并
      const orderMap = new Map()

      // 将 onTimeOrderDetail 数据加入 Map
      onTime.orders.forEach(item => {
        orderMap.set(item.order, { ...item }) // 将每项放入 Map
      })

      // 将 accrueOrderDetail 数据合并到 Map
      accrue.orders.forEach(item => {
        if (orderMap.has(item.order)) {
          // 如果订单已存在于 Map 中，则合并 accrueCount
          orderMap.get(item.order).accrueCount = item.accrueCount
        } else {
          // 如果不存在，则直接加入
          orderMap.set(item.order, { ...item })
        }
      })

      // 将 Map 转为数组
      const mergedOrderDetails = Array.from(orderMap.values())

      // 计算图表所需数据
      const chartData = mergedOrderDetails.map(item => {
        const delayedCount = item.accrueCount - item.onTimeCount // 延期交付数量
        const onTimeRate = item.orderCount > 0 ? (item.onTimeCount / item.orderCount) * 100 : 0

        return {
          order: item.order,
          orderCount: item.orderCount,
          onTimeCount: item.onTimeCount,
          delayedCount: delayedCount, // 延期交付数量
          accrueCount: item.accrueCount,
          onTimeRate: onTimeRate.toFixed(2), // 保留两位小数
        }
      })

      //各产品产量统计
      const orders = await ProductionOrder.findAll({
        order: [['processes', 'id', 'ASC']],
        include: [
          {
            association: 'bom',
            attributes: ['id', 'materialId'],
            required: true,
            include: [
              {
                association: 'parentMaterial',
                attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status', 'category'],
                where: {
                  category: '成品',
                },
                required: true,
              },
            ],
          },
          {
            association: 'processes',
            include: [
              {
                association: 'process',
                attributes: ['id', 'processName'],
              },
            ],
          },
        ],
      })
      const productionStatistics = await this.productionStatistics(orders, startTime, endTime)

      let productionArrays = []
      for (const order of orders) {
        productionArrays.push(order.id)
      }

      // 查询不良品项分布数据
      const defectiveItemDistribution = await PRI.findAll({
        attributes: [
          'defectiveItemId',
          [fn('SUM', col('count')), 'totalCount'], // 统计每个不良品项的总数量
        ],
        include: [
          {
            association: 'defectiveItem',
            attributes: ['name'], // 获取不良品项的名称
            as: 'defectiveItem', // 设置别名，确保关联正确
          },
          {
            association: 'productionReport',
            where: {
              endTime: {
                [Op.between]: [startTime, endTime],
              },
            },
            attributes: [],
          },
        ],
        group: ['defectiveItemId', 'defectiveItem.name'], // 使用别名进行分组
        order: [[fn('SUM', col('count')), 'DESC']], // 按数量降序排列
      })

      // 格式化结果以便生成图表

      const defect = defectiveItemDistribution.map(item => ({
        name: item.dataValues.defectiveItem.name,
        // @ts-ignore
        count: item.dataValues.totalCount,
      }))

      //设备运行概况
      const equipment = await EquipmentLedger.findAll()

      const checkRecords = await CheckOrder.findAll({
        where: {
          checkAt: {
            [Op.between]: [startTime, endTime],
          },
        },
        raw: true,
      })

      const inspectionRecords = await InspectionOrder.findAll({
        raw: true,
        where: {
          checkAt: {
            [Op.between]: [startTime, endTime],
          },
        },
      })

      const repairRecords = await RepairOrder.findAll({
        raw: true,
        include: [
          {
            association: 'detail',
            where: {
              repairDate: {
                [Op.between]: [startTime, endTime],
              },
            },
          },
        ],
      })

      const equipmentSummary = await EquipmentLedger.findAll({
        attributes: ['status', [Sequelize.fn('COUNT', 'status'), 'count']],
        include: [
          {
            association: 'equipment',
            as: 'equipment',
            attributes: ['name'],
          },
        ],
        group: ['status', Sequelize.col('equipment.name')],
        raw: true,
      })

      // 数据格式化

      const equipmentData = equipmentSummary.map(item => ({
        status: item.status,
        // @ts-ignore
        count: item.count,
        equipmentName: item['equipment.name'],
      }))
      return {
        totalOrder: salesOrder.length, //销售订单数
        orderOnTimeRate: onTime.delivered + onTime.undelivered == 0 ? 0 : ((onTime.delivered / (onTime.delivered + onTime.undelivered)) * 100).toFixed(2), //按时交付率
        orderAccrueRate: accrue.delivered + accrue.undelivered == 0 ? 0 : ((accrue.delivered / (accrue.delivered + accrue.undelivered)) * 100).toFixed(2), //累积交付率
        totalPlanCount, //计划交付数
        countOnTimeRate: totalPlanCount == 0 ? 0 : ((onTime.totalOutCount / totalPlanCount) * 100).toFixed(2), //按时交付率
        countAccrueRate: totalPlanCount == 0 ? 0 : ((accrue.totalOutCount / totalPlanCount) * 100).toFixed(2), //累积交付率
        chartData, //各产品交付统计
        productionStatistics, //产量统计   质量统计
        defect, //不良品分布
        equipment: {
          equipmentCount: equipment.length, //设备台数
          checkCount: checkRecords.length, //累积点检次数
          inspectionCount: inspectionRecords.length, //累积巡检次数
          repairCount: repairRecords.length, //累积报修次数
        },
        equipmentData, //设备状态分布
      }
    } else if (user1 && (user1?.role?.name === '生产人员' || user1?.role?.name == '班组长')) {
      const orders = await ProductionOrder.findAll({
        where: {
          startTime: {
            [Op.between]: [startTime, endTime],
          },
        },
        include: [
          {
            association: 'processes',
            required: true,
            include: [
              {
                association: 'process',
                attributes: ['id', 'processName'],
              },
              {
                association: 'depts',
                attributes: ['id', 'name'],
                where: { id: user1.departmentId },
                required: true,
                through: {
                  attributes: [], // 隐藏中间表的数据
                },
              },
            ],
          },
        ],
      })

      let planCount = 0
      let actualOutput = 0

      for (const order of orders) {
        planCount += Number(order.plannedOutput)
        actualOutput += Number(order.actualOutput)
      }

      const overTimeOrder = await ProductionOrder.findAll({
        where: {
          endTime: {
            [Op.lt]: startTime,
          },
        },
        include: [
          {
            association: 'processes',
            required: true,
            include: [
              {
                association: 'process',
                attributes: ['id', 'processName'],
              },
              {
                association: 'depts',
                attributes: ['id', 'name'],
                where: { id: user1.departmentId },
                required: true,
                through: {
                  attributes: [], // 隐藏中间表的数据
                },
              },
            ],
          },
        ],
      })

      let overTimeOrderCount = 0
      for (const productionOrder of overTimeOrder) {
        if (productionOrder.plannedOutput > productionOrder.actualOutput) {
          overTimeOrderCount++
        }
      }

      let goods = 0
      let bads = 0
      let salary = 0
      const reports = await ProductionReport.findAll({
        where: {
          createdAt: {
            [Op.between]: [startTime, endTime],
          },
          productUserId: {
            [Op.eq]: user1.id,
          },
        },
      })

      for (const report of reports) {
        goods += Number(report.goodCount)
        bads += Number(report.badCount)
        salary += Number(report.estimatedWage)
      }
      let badRate = goods + bads ? ((bads / (goods + bads)) * 100).toFixed(2) : '0.00'

      //获取部门的所有工序
      const processList = await Process.findAll({
        include: [
          {
            association: 'processDept',
            attributes: ['id', 'name'],
            where: { id: user1.departmentId },
            required: true,
            through: {
              attributes: [], // 隐藏中间表的数据
            },
          },
        ],
      })

      let ids = []
      for (const process1 of processList) {
        ids.push(process1.id)
      }

      const processes = await ProcessTask.findAll({
        where: {
          endTime: {
            [Op.between]: [startTime, endTime],
          },
        },
        include: [
          {
            association: 'process',
            attributes: ['id', 'processName'],
            where: { id: { [Op.in]: ids } },
            required: true,
          },
        ],
      })

      const processSet = new Set()
      let processArray = []

      for (const process1 of processes) {
        const processId = process1.processId
        const processName = process1.dataValues.process.dataValues.processName

        // 使用 processId 确保唯一性
        if (!processSet.has(processId)) {
          processSet.add(processId)
          processArray.push({
            id: processId,
            processName: processName,
          })
        }
      }

      const report = await ProductionReport.findAll({ where: { productUserId: user1.id } })
      let reportList = []
      for (const productionReport of report) {
        reportList.push(productionReport.id)
      }

      // 查询不良品项分布数据
      const defectiveItemDistribution = await PRI.findAll({
        where: {
          createdAt: {
            [Op.between]: [startTime, endTime],
          },
          productionReportId: {
            [Op.in]: reportList,
          },
        },
        attributes: [
          'defectiveItemId',
          [fn('SUM', col('count')), 'totalCount'], // 统计每个不良品项的总数量
        ],
        include: [
          {
            association: 'defectiveItem',
            attributes: ['name'], // 获取不良品项的名称
            as: 'defectiveItem', // 设置别名，确保关联正确
          },
          {
            association: 'productionReport',
            attributes: [],
          },
        ],
        group: ['defectiveItemId', 'defectiveItem.name'], // 使用别名进行分组
        order: [[fn('SUM', col('count')), 'DESC']], // 按数量降序排列
      })

      // 格式化结果以便生成图表

      const defect = defectiveItemDistribution.map(item => ({
        name: item.dataValues.defectiveItem.name,
        // @ts-ignore
        count: item.dataValues.totalCount,
      }))

      const orders1 = await ProductionOrder.findAll({
        where: {
          endTime: {
            [Op.between]: [startTime, endTime],
          },
        },
        include: [
          {
            association: 'bom',
            attributes: ['id', 'materialId', 'parentId', 'remark', 'version', 'quantity', 'formData'],
            required: true,
            include: [
              {
                association: 'parentMaterial',
                attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
                required: true,
              },
            ],
          },
        ],
      })

      const formatOrder = orders1.map(order => ({
        code: order.code,
        name: order.dataValues.bom.dataValues.parentMaterial.dataValues.name,
        planCount: order.plannedOutput,
        actualOutput: order.actualOutput,
        doneRate: Number(order.plannedOutput) ? ((Number(order.actualOutput) / Number(order.plannedOutput)) * 100).toFixed(2) : 0.0,
      }))

      return {
        planCount: planCount ? planCount : 0, //计划数量
        actualOutput: actualOutput ? actualOutput : 0, //完成数量
        overTimeOrderCount: overTimeOrderCount ? overTimeOrderCount : 0, //超期未完成工单数
        formatOrder,
        salary, //绩效工资
        badRate, //不良品率
        processArray, //工序列表
        defect, //不良品明细
      }
    }
    // if (user1 && user1?.role?.name === '车间主任')
    else {
      const planCount = await ProductionOrder.sum('plannedOutput', {
        where: {
          endTime: {
            [Op.between]: [startTime, endTime],
          },
        },
      })

      const actualOutput = await ProductionOrder.sum('actualOutput', {
        where: {
          endTime: {
            [Op.between]: [startTime, endTime],
          },
        },
      })

      const overTimeOrder = await ProductionOrder.findAll({
        where: {
          endTime: {
            [Op.lt]: startTime,
          },
        },
      })

      let overTimeOrderCount = 0
      for (const productionOrder of overTimeOrder) {
        if (productionOrder.plannedOutput > productionOrder.actualOutput) {
          overTimeOrderCount++
        }
      }

      let goods = 0
      let bads = 0
      const reports = await ProductionReport.findAll({
        where: {
          createdAt: {
            [Op.between]: [startTime, endTime],
          },
        },
      })

      for (const report of reports) {
        goods += Number(report.goodCount)
        bads += Number(report.badCount)
      }
      let badRate = goods + bads ? ((bads / (goods + bads)) * 100).toFixed(2) : '0.00'

      const task = await ProcessTask.findAll({
        where: {
          endTime: {
            [Op.between]: [startTime, endTime],
          },
        },
        attributes: [
          [Sequelize.fn('sum', Sequelize.col('planCount')), 'totalPlanCount'], // 汇总计划数
          [Sequelize.fn('sum', Sequelize.col('goodCount')), 'totalGoodCount'], // 汇总良品数
          [Sequelize.fn('sum', Sequelize.col('badCount')), 'totalBadCount'], // 汇总不良品数
          [
            Sequelize.literal(`CASE WHEN SUM(planCount) = 0 THEN 0 ELSE ROUND((SUM(goodCount) / CAST(SUM(planCount) AS DECIMAL(10, 2))) * 100, 2) END`),
            'completionRate', // 完工率百分比，保留两位小数
          ],
        ],
        include: [
          {
            association: 'process',
            attributes: ['processName'], // 获取工序名称
          },
        ],
        group: ['processName'], // 按工序名称分组
        order: [[Sequelize.literal('totalPlanCount'), 'DESC']], // 按汇总计划数降序排列
        raw: true, // 返回原始数据
      })

      const formattedTask = task.map(t => ({
        totalPlanCount: t['totalPlanCount'],
        totalGoodCount: t['totalGoodCount'],
        totalBadCount: t['totalBadCount'],
        completionRate: t['completionRate'],
        processName: t['process.processName'],
        // 删除多余的 `process.processName` 字段
      }))

      // 查询不良品项分布数据
      const defectiveItemDistribution = await PRI.findAll({
        where: {
          createdAt: {
            [Op.between]: [startTime, endTime],
          },
        },
        attributes: [
          'defectiveItemId',
          [fn('SUM', col('count')), 'totalCount'], // 统计每个不良品项的总数量
        ],
        include: [
          {
            association: 'defectiveItem',
            attributes: ['name'], // 获取不良品项的名称
            as: 'defectiveItem', // 设置别名，确保关联正确
          },
          {
            association: 'productionReport',
            attributes: [],
          },
        ],
        group: ['defectiveItemId', 'defectiveItem.name'], // 使用别名进行分组
        order: [[fn('SUM', col('count')), 'DESC']], // 按数量降序排列
      })

      // 格式化结果以便生成图表

      const defect = defectiveItemDistribution.map(item => ({
        name: item.dataValues.defectiveItem.name,
        // @ts-ignore
        count: item.dataValues.totalCount,
      }))

      //设备
      const totalEquipmentCount = await EquipmentLedger.count()

      const normalEquipmentCount = await EquipmentLedger.count({ where: { status: '正常运行' } })

      const illEquipmentCount = await EquipmentLedger.count({ where: { status: '带病运行' } })

      const repairEquipmentCount = await EquipmentLedger.count({ where: { status: '维修中' } })

      const scrapEquipmentCount = await EquipmentLedger.count({ where: { status: { [Op.in]: ['报废', '停用'] } } })

      //设备点检情况

      const totalEquipment = await EquipmentLedger.findAll()

      let waitCheckCount = 0
      let checkedCount = 0
      let waitInspectionCount = 0
      let inspectedCount = 0
      for (const equipment of totalEquipment) {
        //检查是否有点检标准
        if (equipment && equipment.checkStandardId) {
          const checkOrder = await CheckOrder.findOne({
            where: {
              equipmentLedgerId: equipment.id,
              createdAt: { [Op.between]: [startTime, endTime] },
            },
          })
          if (checkOrder) {
            checkedCount++
          } else {
            waitCheckCount++
          }
        }

        //检查是否有巡检标准
        if (equipment && equipment.inspectionPlanId) {
          const inspectionOrder = await InspectionOrder.findOne({
            where: {
              equipmentLedgerId: equipment.id,
              createdAt: { [Op.between]: [startTime, endTime] },
            },
          })
          if (inspectionOrder) {
            inspectedCount++
          } else {
            waitInspectionCount++
          }
        }
      }

      const todayStart = moment().startOf('day').format('YYYY-MM-DD HH:mm:ss')
      const todayEnd = moment().endOf('day').format('YYYY-MM-DD HH:mm:ss')
      // 获取设备台账
      const equipmentLedgers = await EquipmentLedger.findAll({
        include: [
          {
            association: 'equipment',
            attributes: ['name'],
          },
          {
            association: 'checkStandard',
            attributes: ['id', 'code', 'name', 'status'],
          },
          {
            association: 'inspectionPlan',
            attributes: ['id', 'code', 'name', 'frequency', 'times', 'status'],
          },
        ],
      })

      // 统计待点检数和待巡检数
      const inspectionSummary = await Promise.all(
        equipmentLedgers.map(async ledger => {
          const equipmentName = ledger.dataValues.equipment.dataValues.name
          const inspectionPlan = ledger.dataValues.inspectionPlan // 现在只有一个巡检计划

          let waitCheckCount = 0 // 待点检数
          let waitInspectionCount = 0 // 待巡检数

          // 检查当天是否有点检单
          const checkOrder = await CheckOrder.findOne({
            where: {
              equipmentLedgerId: ledger.id,
              checkAt: {
                [Op.between]: [todayStart, todayEnd],
              },
            },
          })

          // 统计待点检数
          if (!checkOrder) {
            waitCheckCount = 1
          }

          // 处理巡检计划
          if (inspectionPlan) {
            const frequency = inspectionPlan.frequency
            const requiredTimes = inspectionPlan.times

            if (frequency === '日检') {
              // 统计当日已经完成的日检次数
              const completedCount = await InspectionOrder.count({
                where: {
                  equipmentLedgerId: ledger.id,
                  checkAt: {
                    [Op.between]: [todayStart, todayEnd], // 当天的时间范围
                  },
                },
              })

              // 如果已完成次数少于要求次数，则需要巡检
              if (completedCount < requiredTimes) {
                waitInspectionCount += requiredTimes - completedCount
              }
            } else {
              // 对于周检、月检、季度检、年检，只需在周期内完成一次
              let startDate, endDate
              let currentDate = moment() // 当前日期，默认为现在的时间

              switch (frequency) {
                case '周检':
                  startDate = currentDate.clone().startOf('week').format('YYYY-MM-DD HH:mm:ss') // 周开始时间
                  endDate = currentDate.clone().endOf('week').format('YYYY-MM-DD HH:mm:ss') // 周结束时间
                  break
                case '月检':
                  startDate = currentDate.clone().startOf('month').format('YYYY-MM-DD HH:mm:ss') // 月开始时间
                  endDate = currentDate.clone().endOf('month').format('YYYY-MM-DD HH:mm:ss') // 月结束时间
                  break
                case '季度检':
                  startDate = currentDate.clone().startOf('quarter').format('YYYY-MM-DD HH:mm:ss') // 季度开始时间
                  endDate = currentDate.clone().endOf('quarter').format('YYYY-MM-DD HH:mm:ss') // 季度结束时间
                  break
                case '年检':
                  startDate = currentDate.clone().startOf('year').format('YYYY-MM-DD HH:mm:ss') // 年开始时间
                  endDate = currentDate.clone().endOf('year').format('YYYY-MM-DD HH:mm:ss') // 年结束时间
                  break
              }

              // 检查该周期内是否已经完成巡检
              const completedCount = await InspectionOrder.count({
                where: {
                  equipmentLedgerId: ledger.id,
                  checkAt: {
                    [Op.between]: [startDate, endDate],
                  },
                },
              })

              // 如果该周期内未完成，则需要一次巡检
              if (completedCount === 0) {
                waitInspectionCount += 1
              }
            }
          }

          // 返回合并后的结果
          return {
            equipmentName,
            runningCount: 1, // 假设设备是正常运行状态，您可以根据实际数据设置
            waitCheckCount, //待点检数
            waitInspectionCount, //待点检数
          }
        })
      )

      // 合并相同的设备名称
      const mergedSummary = inspectionSummary.reduce((acc, item) => {
        const existing = acc.find(entry => entry.equipmentName === item.equipmentName)

        if (existing) {
          // 如果设备名称已存在，则累加各个计数
          existing.runningCount += item.runningCount
          existing.waitCheckCount += item.waitCheckCount
          existing.waitInspectionCount += item.waitInspectionCount
        } else {
          // 如果设备名称不存在，则添加一个新对象
          acc.push({ ...item })
        }

        return acc
      }, [])

      const orders = await ProductionOrder.findAll({
        where: {
          endTime: {
            [Op.between]: [startTime, endTime],
          },
        },
        include: [
          {
            association: 'bom',
            attributes: ['id', 'materialId', 'parentId', 'remark', 'version', 'quantity', 'formData'],
            required: true,
            include: [
              {
                association: 'parentMaterial',
                attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
                required: true,
              },
            ],
          },
        ],
      })

      const formatOrder = orders.map(order => ({
        code: order.code,
        name: order.dataValues.bom.dataValues.parentMaterial.dataValues.name,
        planCount: order.plannedOutput,
        actualOutput: order.actualOutput,
        doneRate: Number(order.plannedOutput) ? ((Number(order.actualOutput) / Number(order.plannedOutput)) * 100).toFixed(2) : 0.0,
      }))

      return {
        planCount: planCount ? planCount : 0, //计划数量
        actualOutput: actualOutput ? actualOutput : 0, //完成数量
        overTimeOrderCount: overTimeOrderCount ? overTimeOrderCount : 0, //超期未完成工单数
        badRate, //不良品率
        formatOrder,
        formattedTask, //工序进度
        defect, //不良品分布
        equipmentStatus: {
          totalEquipmentCount, //总设备台数
          normalEquipmentCount, //正常运行
          illEquipmentCount, //带病运行
          repairEquipmentCount, //停机待修
          scrapEquipmentCount, //报废/停用
          waitCheckCount, //待点检
          checkedCount, //已点检
          waitInspectionCount, //待巡检
          inspectedCount, //已巡检
        },
        summary: mergedSummary, //设备点检巡检状态
      }
    }
    return {}
  }

  public async productionBroadcast(dto: RoleBoardDto, user, loadModel) {
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
    const options: FindPaginationOptions = {
      where: {
        endTime: {
          [Op.between]: [startTime, endTime],
        },
      },
      pagination,
      include: [
        {
          association: 'order',
          attributes: ['id', 'code', 'plannedOutput', 'plannedOutput'],
          where: {},
          include: [
            {
              association: 'bom',
              attributes: ['id', 'materialId', 'parentId', 'remark', 'version', 'quantity', 'formData'],
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
          where: {},
        },
        {
          association: 'productUser',
          attributes: ['id', 'userCode', 'userName'],
        },
      ],
    }
    const result = await Paging.diyPaging(ProductionReport, pagination, options)
    return result
  }

  public async equipmentBroadcast(dto: RoleBoardDto, user, loadModel) {
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

    const checkOrders = await CheckOrder.findAll({
      where: {
        checkAt: {
          [Op.between]: [startTime, endTime],
        },
      },
      include: [
        {
          association: 'checkUser',
          attributes: ['id', 'userName'],
        },
        {
          association: 'equipmentLedger',
          include: [
            {
              association: 'equipment',
              attributes: ['id', 'name'],
              where: {},
            },
            {
              association: 'workShop',
              attributes: ['id', 'name'],
              where: {},
              required: false,
            },
            {
              association: 'installLocation',
              attributes: ['id', 'locate'],
              where: {},
              required: false,
            },
          ],
        },
      ],
    })

    const checkList = checkOrders.map(checkOrder => ({
      id: checkOrder.dataValues.equipmentLedgerId,
      code: checkOrder.dataValues.equipmentLedger.dataValues.code,
      name: checkOrder.dataValues.equipmentLedger.dataValues.equipment.dataValues.name,
      workShop: checkOrder.dataValues.equipmentLedger.dataValues.workShop ? checkOrder.dataValues.equipmentLedger.dataValues.workShop.dataValues.name : null,
      installLocation: checkOrder.dataValues.equipmentLedger.dataValues.installLocation ? checkOrder.dataValues.equipmentLedger.dataValues.installLocation.dataValues.locate : null,
      info: checkOrder.dataValues.checkUser.dataValues.userName + '完成设备点检',
      time: checkOrder.dataValues.checkAt,
    }))

    const inspectOrders = await InspectionOrder.findAll({
      where: {
        checkAt: {
          [Op.between]: [startTime, endTime],
        },
      },
      include: [
        {
          association: 'checkUser',
          attributes: ['id', 'userName'],
        },
        {
          association: 'equipmentLedger',
          include: [
            {
              association: 'equipment',
              attributes: ['id', 'name'],
              where: {},
            },
            {
              association: 'workShop',
              attributes: ['id', 'name'],
              where: {},
              required: false,
            },
            {
              association: 'installLocation',
              attributes: ['id', 'locate'],
              where: {},
              required: false,
            },
          ],
        },
      ],
    })

    const inspectList = inspectOrders.map(inspectOrder => ({
      id: inspectOrder.dataValues.equipmentLedgerId,
      code: inspectOrder.dataValues.equipmentLedger.code,
      name: inspectOrder.dataValues.equipmentLedger.dataValues.equipment.dataValues.name,
      workShop: inspectOrder.dataValues.equipmentLedger.dataValues.workShop ? inspectOrder.dataValues.equipmentLedger.dataValues.workShop.dataValues.name : null,
      installLocation: inspectOrder.dataValues.equipmentLedger.dataValues.installLocation
        ? inspectOrder.dataValues.equipmentLedger.dataValues.installLocation.dataValues.locate
        : null,
      info: inspectOrder.dataValues.checkUser.dataValues.userName + '完成设备巡检',
      time: inspectOrder.dataValues.checkAt,
    }))

    const repairOrders = await RepairOrderDetail.findAll({
      where: {
        repairDate: {
          [Op.between]: [startTime, endTime],
        },
      },
      include: [
        {
          association: 'repairOrder',
          include: [
            {
              association: 'equipmentLedger',
              include: [
                {
                  association: 'equipment',
                  attributes: ['id', 'name'],
                  where: {},
                },
                {
                  association: 'workShop',
                  attributes: ['id', 'name'],
                  where: {},
                },
                {
                  association: 'installLocation',
                  attributes: ['id', 'locate'],
                  where: {},
                },
              ],
            },
          ],
        },
        {
          association: 'reportUser',
          attributes: ['id', 'userName'],
        },
      ],
    })

    const repairList = repairOrders.map(repairOrder => ({
      id: repairOrder.dataValues.repairOrder.dataValues.equipmentLedgerId,
      code: repairOrder.dataValues.repairOrder.dataValues.equipmentLedger.dataValues.code,
      name: repairOrder.dataValues.repairOrder.dataValues.equipmentLedger.dataValues.equipment.dataValues.name,
      workShop: repairOrder.dataValues.repairOrder.dataValues.equipmentLedger.dataValues.workShop.dataValues.name,
      installLocation: repairOrder.dataValues.repairOrder.dataValues.equipmentLedger.dataValues.installLocation.dataValues.locate,
      info: repairOrder.dataValues.reportUser.dataValues.userName + '故障报修',
      time: repairOrder.dataValues.repairDate,
    }))

    const fixOrders = await RepairOrderResult.findAll({
      where: {
        endAt: {
          [Op.between]: [startTime, endTime],
        },
      },
      include: [
        {
          association: 'repairOrder',
          include: [
            {
              association: 'equipmentLedger',
              include: [
                {
                  association: 'equipment',
                  attributes: ['id', 'name'],
                  where: {},
                },
                {
                  association: 'workShop',
                  attributes: ['id', 'name'],
                  where: {},
                },
                {
                  association: 'installLocation',
                  attributes: ['id', 'locate'],
                  where: {},
                },
              ],
            },
          ],
        },
        {
          association: 'repairUser',
          attributes: ['id', 'userName'],
        },
      ],
    })

    const fixList = fixOrders
      .filter(fixOrder => fixOrder.dataValues.repairUser) // 仅当 repairUser 存在时保留该项
      .map(fixOrder => ({
        id: fixOrder.dataValues.repairOrder.dataValues.equipmentLedgerId,
        code: fixOrder.dataValues.repairOrder.dataValues.equipmentLedger.dataValues.code,
        name: fixOrder.dataValues.repairOrder.dataValues.equipmentLedger.dataValues.equipment.dataValues.name,
        workShop: fixOrder.dataValues.repairOrder.dataValues.equipmentLedger.dataValues.workShop.dataValues.name,
        installLocation: fixOrder.dataValues.repairOrder.dataValues.equipmentLedger.dataValues.installLocation.dataValues.locate,
        info: fixOrder.dataValues.repairUser.dataValues.userName + '维修完成',
        time: fixOrder.dataValues.endAt,
      }))

    let combinedList = [...checkList, ...inspectList, ...repairList, ...fixList]
    const result = Aide.diyPaging(combinedList, pagination)
    return result
  }

  // 计算员工绩效排名的函数
  async calculateEmployeePerformance(ids, startOfToday, endOfToday, pagination: Pagination, loadModel) {
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

  public async orderProgress(user, dto: OrderProgressDto, loadModel) {
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
    const order = await Paging.diyPaging(ProductionOrder, orderPagination, option)
    return order
  }

  public async salary(user, dto: OrderProgressDto, loadModel) {
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
    // user = {id : 9}
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
    const top = await this.calculateEmployeePerformance(ids, startTime, endTime, pagination, loadModel)
    return top
  }

  public async deptProgress(user, dto: taskProgressDto, loadModel) {
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
    const processes = await Paging.diyPaging(ProcessTask, pagination, {
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

  public async questionProcess(user, dto: taskProgressDto, loadModel) {
    let startTime = moment().startOf('month').format('YYYY-MM-DD HH:mm:ss')
    let endTime = moment().endOf('month').format('YYYY-MM-DD HH:mm:ss')

    const pagination: Pagination = {
      current: dto.current ? dto.current : 1,
      pageSize: dto.pageSize ? dto.pageSize : 10,
    }
    const processes = await Paging.diyPaging(ProcessTask, pagination, {
      where: {
        [Op.or]: [
          // 条件1：任务周期在这个月内
          {
            startTime: {
              [Op.lte]: endTime,
            },
            endTime: {
              [Op.gte]: startTime, // 任务结束时间晚于月末
            },
          },
          // 条件2：任务超期（完成日期在这个月之前）
          {
            endTime: {
              [Op.lt]: startTime, // 完成日期早于月初
            },
          },
        ],
      },
      pagination,
      include: [
        {
          association: 'process',
          attributes: ['id', 'processName'],
          required: true,
        },
        {
          association: 'order',
          attributes: ['id', 'code', 'plannedOutput'],
        },
      ],
    })
    for (const datum of processes.data) {
      datum.setDataValue('unfinished', Number(datum['planCount']) - Number(datum['goodCount']))
      datum.setDataValue('rate', ((datum['goodCount'] / datum['planCount']) * 100).toFixed(2))
    }
    return processes
  }

  public async workShopBoard(dto: RoleBoardDto, user, loadModel: any) {
    //本日
    let startTime = moment().startOf('day').format('YYYY-MM-DD HH:mm:ss')
    let endTime = moment().endOf('day').format('YYYY-MM-DD HH:mm:ss')
    let planCount = await ProductionOrder.sum('plannedOutput', {
      where: {
        endTime: {
          [Op.between]: [startTime, endTime],
        },
      },
    })

    let actualOutput = await ProductionOrder.sum('actualOutput', {
      where: {
        endTime: {
          [Op.between]: [startTime, endTime],
        },
      },
    })

    let overTimeOrder = await ProductionOrder.findAll({
      where: {
        endTime: {
          [Op.lt]: startTime,
        },
      },
    })

    let overTimeOrderCount = 0
    for (const productionOrder of overTimeOrder) {
      if (productionOrder.plannedOutput > productionOrder.actualOutput) {
        overTimeOrderCount++
      }
    }

    let goods = 0
    let bads = 0
    let reports = await ProductionReport.findAll({
      where: {
        createdAt: {
          [Op.between]: [startTime, endTime],
        },
      },
    })

    for (const report of reports) {
      goods += Number(report.goodCount)
      bads += Number(report.badCount)
    }
    let badRate = goods + bads ? ((bads / (goods + bads)) * 100).toFixed(2) : '0.00'

    const today = {
      planCount: planCount ? planCount : 0, //计划数量
      actualOutput: actualOutput ? actualOutput : 0, //完成数量
      overTimeOrderCount: overTimeOrderCount ? overTimeOrderCount : 0, //超期未完成工单数
      badRate, //不良品率
    }

    //本月
    startTime = moment().startOf('month').format('YYYY-MM-DD HH:mm:ss')
    endTime = moment().endOf('month').format('YYYY-MM-DD HH:mm:ss')
    planCount = await ProductionOrder.sum('plannedOutput', {
      where: {
        endTime: {
          [Op.between]: [startTime, endTime],
        },
      },
    })

    actualOutput = await ProductionOrder.sum('actualOutput', {
      where: {
        endTime: {
          [Op.between]: [startTime, endTime],
        },
      },
    })

    overTimeOrder = await ProductionOrder.findAll({
      where: {
        endTime: {
          [Op.lt]: startTime,
        },
      },
    })

    overTimeOrderCount = 0
    for (const productionOrder of overTimeOrder) {
      if (productionOrder.plannedOutput > productionOrder.actualOutput) {
        overTimeOrderCount++
      }
    }

    goods = 0
    bads = 0
    reports = await ProductionReport.findAll({
      where: {
        createdAt: {
          [Op.between]: [startTime, endTime],
        },
      },
    })

    for (const report of reports) {
      goods += Number(report.goodCount)
      bads += Number(report.badCount)
    }
    badRate = goods + bads ? ((bads / (goods + bads)) * 100).toFixed(2) : '0.00'

    const thisMonth = {
      planCount: planCount ? planCount : 0, //计划数量
      actualOutput: actualOutput ? actualOutput : 0, //完成数量
      overTimeOrderCount: overTimeOrderCount ? overTimeOrderCount : 0, //超期未完成工单数
      badRate, //不良品率
    }

    // 查询不良品项分布数据
    const defectiveItemDistribution = await PRI.findAll({
      where: {
        createdAt: {
          [Op.between]: [startTime, endTime],
        },
      },
      attributes: [
        'defectiveItemId',
        [fn('SUM', col('count')), 'totalCount'], // 统计每个不良品项的总数量
      ],
      include: [
        {
          association: 'defectiveItem',
          attributes: ['name'], // 获取不良品项的名称
          as: 'defectiveItem', // 设置别名，确保关联正确
        },
        {
          association: 'productionReport',
          attributes: [],
        },
      ],
      group: ['defectiveItemId', 'defectiveItem.name'], // 使用别名进行分组
      order: [[fn('SUM', col('count')), 'DESC']], // 按数量降序排列
    })

    // 格式化结果以便生成图表

    const defect = defectiveItemDistribution.map(item => ({
      name: item.dataValues.defectiveItem.name, //不良品项名称
      // @ts-ignore
      count: item.dataValues.totalCount, //不良品项数量
    }))

    // 计算最近七天的日期范围
    const endDate = moment().endOf('day').toDate() // 今天结束时间
    const startDate = moment().subtract(6, 'days').startOf('day').toDate() // 7天前的开始时间

    // 获取日期范围
    const dateRange = []
    const current = moment(startDate)
    while (current.isSameOrBefore(endDate)) {
      dateRange.push(current.format('YYYY-MM-DD'))
      current.add(1, 'days')
    }

    // 查询数据库
    const results = await ProductionReport.findAll({
      attributes: [
        [fn('DATE', col('startTime')), 'reportDate'],
        [fn('SUM', col('goodCount')), 'totalGoodCount'],
        [fn('SUM', col('badCount')), 'totalBadCount'],
      ],
      where: {
        startTime: {
          [Op.between]: [startDate, endDate],
        },
      },
      group: [fn('DATE', col('startTime'))],
      raw: true,
    })

    // 转换查询结果为键值对
    const resultMap = results.reduce((acc, row) => {
      // @ts-ignore
      acc[row.reportDate] = {
        // @ts-ignore
        totalGoodCount: row.totalGoodCount || 0,
        // @ts-ignore
        totalBadCount: row.totalBadCount || 0,
      }
      return acc
    }, {})

    // 补全缺失日期
    const finalResult = dateRange.map(date => ({
      date, //日期
      totalGoodCount: resultMap[date]?.totalGoodCount || 0, //良品数
      totalBadCount: resultMap[date]?.totalBadCount || 0, //不良品数
      goodRate:
        resultMap[date]?.totalGoodCount + resultMap[date]?.totalBadCount > 0
          ? ((resultMap[date]?.totalGoodCount / (resultMap[date]?.totalGoodCount + resultMap[date]?.totalBadCount)) * 100).toFixed(2)
          : '0.00',
    }))

    const task = await ProcessTask.findAll({
      where: {
        endTime: {
          [Op.between]: [startTime, endTime],
        },
      },
      attributes: [
        [Sequelize.fn('sum', Sequelize.col('planCount')), 'totalPlanCount'], // 汇总计划数
        [Sequelize.fn('sum', Sequelize.col('goodCount')), 'totalGoodCount'], // 汇总良品数
        [Sequelize.fn('sum', Sequelize.col('badCount')), 'totalBadCount'], // 汇总不良品数
        [
          Sequelize.literal(`CASE WHEN SUM(planCount) = 0 THEN 0 ELSE ROUND((SUM(goodCount) / CAST(SUM(planCount) AS DECIMAL(10, 2))) * 100, 2) END`),
          'completionRate', // 完工率百分比，保留两位小数
        ],
        [
          Sequelize.literal(`SUM(planCount) - SUM(goodCount)`),
          'totalUnfinishedCount', // 未完成数
        ],
      ],
      include: [
        {
          association: 'process',
          attributes: ['processName'], // 获取工序名称
        },
      ],
      group: ['processName'], // 按工序名称分组
      order: [[Sequelize.literal('totalPlanCount'), 'DESC']], // 按汇总计划数降序排列
      raw: true, // 返回原始数据
    })

    const formattedTask = task.map(t => ({
      totalPlanCount: t['totalPlanCount'], // 汇总计划数
      totalGoodCount: t['totalGoodCount'], // 汇总良品数
      totalBadCount: t['totalBadCount'], // 汇总不良品数
      completionRate: t['completionRate'], //完工率
      totalUnfinishedCount: t['totalUnfinishedCount'], // 未完成数
      processName: t['process.processName'], //工序名称
      // 删除多余的 `process.processName` 字段
    }))

    return {
      today,
      thisMonth,
      defect,
      finalResult,
      formattedTask,
    }
  }
}
