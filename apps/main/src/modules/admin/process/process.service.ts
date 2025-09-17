import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import { Process } from '@model/process/process.model'
import { CProcessDto, findMaterialDto, FindPaginationDto, UProcessDto, FindProcessDto, FindNextProcessPalletDto } from './process.dto'
import { FindOptions, Op, Sequelize } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { ProcessItems } from '@model/process/processItems.model'
import { Aide, JsExclKey } from '@library/utils/aide'
import { Material } from '@model/base/material.model'
import { Organize } from '@model/auth/organize'
import { DefectiveItem } from '@model/quantity/defectiveItem.model'
import { deleteIdsDto } from '@common/dto'
import { ProcessRoute } from '@model/process/processRoute.model'
import { ProcessDept } from '@model/process/processDept.model'
import { trim } from 'lodash'
import { ProcessTask } from '@model/production/processTask.model'
import { ResultVO } from '@common/resultVO'
import { ProcessRouteList } from '@model/process/processRouteList.model'
import { ProductionReport } from '@model/production/productionReport.model'
import { Paging } from '@library/utils/paging'
import { POPSchedule } from '@model/index'
import { Pallet } from '@model/base/pallet.model'
import { PalletDetail } from '@model/base/palletDetail.model'
import { Team } from '@model/auth/team'
import { TeamProcess } from '@model/auth/teamProcess.model'

@Injectable()
export class ProcessService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: Redis,

    @InjectModel(Process)
    private processModel: typeof Process
  ) {}

  public async create(dto: CProcessDto, loadModel) {
    const { processName, parentId, departmentId } = dto

    if (parentId) {
      const parentProcess = await Process.findOne({ where: { id: parentId } })
      if (!parentProcess) {
        throw new HttpException('父级工序不存在', 400)
      }
    } else {
      const temp = await Process.findOne({ where: { processName } })
      if (temp) throw new HttpException('同名工序已存在', 400)
    }

    const result = await Process.create({ ...dto, isChild: parentId ? 1 : 0 })
    if (dto.defectiveItems) {
      await ProcessItems.bulkCreate(
        dto.defectiveItems.map(v => ({
          processId: result.id,
          defectiveItemId: v,
        }))
      )
    }

    await ProcessDept.bulkCreate(
      dto.departmentId.map(num => ({
        processId: result.id,
        deptId: num,
      }))
    )
    return result
  }

  public async edit(dto: UProcessDto, id: number, loadModel) {
    let process = await Process.findOne({ where: { id } })
    if (!process) {
      throw new HttpException('数据不存在', 400006)
    }

    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new HttpException('父级工序不能指定当前工序', 400)
      }
      const parentProcess = await Process.findOne({ where: { id: dto.parentId } })
      if (!parentProcess) {
        throw new HttpException('父级工序不存在', 400)
      }
    }

    if (dto.processName != process.processName) {
      if (dto.processName) {
        const temp = await Process.findOne({ where: { processName: dto.processName } })
        if (temp) {
          throw new HttpException('同名工序已存在', 400)
        }
      }
    }
    await process.update({ ...dto, isChild: dto.parentId ? 1 : 0 })
    if (dto.defectiveItems) {
      await ProcessItems.destroy({ where: { processId: id } })
      await ProcessItems.bulkCreate(
        dto.defectiveItems.map(v => ({
          processId: id,
          defectiveItemId: v,
        }))
      )
    }

    if (dto.departmentId) {
      await ProcessDept.destroy({ where: { processId: id } })
      await ProcessDept.bulkCreate(
        dto.departmentId.map(num => ({
          processId: id,
          deptId: num,
        }))
      )
    }
    process = await Process.findOne({ where: { id } })
    return process
  }

  public async delete(id: number, loadModel) {
    const route = await ProcessRouteList.findOne({ where: { processId: id } })
    const schedule = await POPSchedule.findOne({ where: { processId: id } })
    const task = await ProcessTask.findOne({ where: { processId: id } })
    const report = await ProductionReport.findOne({ where: { processId: id } })
    if (route || schedule || task || report) {
      throw new HttpException('该工序已存在后续业务数据（如工艺路线、工单\\任务单\\报工等），不允许删除！', 400)
    }
    //先删除子工序
    await Process.destroy({ where: { isChild: 0, parentId: id } })
    const result = await Process.destroy({
      where: {
        id: id,
      },
    })
    return result
  }

  public async find(id: number, loadModel, dto: FindProcessDto) {
    const options: FindOptions = {
      where: { id },
      include: [
        // {
        //   association: 'processItem',
        //   attributes: ['id', 'name'],
        // },
        {
          association: 'processDept',
          attributes: ['id', 'name'],
          where: {},
        },
        {
          association: 'parent',
          attributes: ['id', 'processName'],
          required: false,
        },
        {
          association: 'children',
          attributes: ['id', 'processName', 'sort', 'reportRatio', 'createdAt', 'updatedAt'],
          required: false,
        },
      ],
    }

    if (dto.productionOrderTaskId) {
      options.include[2]['attributes'].push([
        Sequelize.literal(`(
        SELECT COALESCE(SUM(pld.assignCount), 0)
        FROM process_locate_detail pld
        INNER JOIN process_locate pl ON pld.processLocateId = pl.id
        WHERE pld.processId = \`children\`.\`id\`
        ${`AND pl.productionOrderTaskId = ${dto.productionOrderTaskId}`}
      )`),
        'totalAssignedCount',
      ])
    }

    const result = await Process.findOne(options)
    return result
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, simplify = false) {
    const options: FindPaginationOptions = {
      where: { isChild: 0 },
      pagination,
      include: [
        {
          association: 'processItem',
          attributes: ['id', 'name'],
          required: false,
        },
        {
          association: 'processDept',
          attributes: ['id', 'name'],
          where: {},
          required: false,
        },
        {
          association: 'children',
          attributes: ['id', 'processName', 'reportRatio', 'createdAt', 'updatedAt', 'parentId', 'sort', 'isQC'],
          where: {},
          required: false,
          include: [
            {
              association: 'processDept',
              attributes: ['id', 'name'],
              required: false,
            },
            {
              association: 'parent',
              attributes: ['id', 'processName'],
              required: false,
            },
          ],
          order: [
            ['sort', 'ASC'],
            ['id', 'ASC'],
          ],
          separate: true,
        },
      ],
      order: [
        ['sort', 'ASC'],
        ['id', 'ASC'],
      ],
    }
    if (dto.processName) {
      options.where['processName'] = {
        [Op.like]: `%${dto.processName}%`,
      }
    }
    if (dto.departmentId) {
      options.include[1]['where']['id'] = {
        [Op.in]: dto.departmentId,
      }
      options.include[1].required = true
    }

    if (dto.filterId) {
      options.where['id'] = {
        [Op.notIn]: dto.filterId,
      }
    }

    if (dto.prePocessId) {
      const process = await Process.findOne({ where: { id: dto.prePocessId } })
      if (!process.dataValues.parentId) {
        throw new HttpException('未找到对应的父工序', 400)
      }
      options.where['id'] = process.dataValues.parentId
      options.include[2].where['id'] = {
        [Op.lt]: dto.prePocessId,
      }
    }

    if (simplify) {
      return Process.findAll({
        where: options.where,
        attributes: ['id', 'processName'],
      })
    }

    const result = await Paging.diyPaging(Process, pagination, options)
    return result
  }
  public async importExcel(buffer: Buffer, loadModel) {
    const mapper: JsExclKey[] = [
      {
        keyName: '工序名称',
        key: 'processName',
      },
      {
        keyName: '报工部门',
        key: 'deptName',
      },
      {
        keyName: '报工数配比',
        key: 'reportRatio',
      },
      {
        keyName: '不良品项列表',
        key: 'items',
      },
    ]
    let result = {}
    let processSuccess = 0
    let processUpdate = 0
    let processFailed = 0
    let total = 0

    // 将当前Sheet的数据转换为JSON
    const json = await Aide.excelToJson(buffer, mapper)
    // 遍历每行数据并保存到数据库

    const sequelize = Process.sequelize
    return sequelize.transaction(async transaction => {
      try {
        outLoop: for (const rowElement of json.row) {
          const deptNames = rowElement.deptName.split(',')
          let arr = []
          let itemArr = []
          for (const deptName of deptNames) {
            const dept = await Organize.findOne({ where: { name: deptName } })
            if (!dept) {
              processFailed++
              continue outLoop
            } else {
              arr.push(dept.id)
            }
          }
          const list = rowElement.items.split(',')
          for (const item of list) {
            const i = await DefectiveItem.findOne({
              where: {
                name: item,
              },
            })
            if (!i) {
              processFailed++
              throw new HttpException('未找到对应的不良品项', 400)
            } else {
              itemArr.push(i.id)
            }
          }
          if (arr.length != 0) {
            let process = await Process.findOne({ where: { processName: trim(rowElement.processName) } })
            if (process) {
              await process.update({ processName: rowElement.processName, reportRatio: parseFloat(trim(rowElement.reportRatio)) }, { transaction })
              for (const itemArrElement of itemArr) {
                await ProcessItems.create({ processId: process.id, defectiveItemId: itemArrElement }, { transaction })
              }
              for (const num of arr) {
                await ProcessDept.create({ processId: process.id, deptId: num }, { transaction })
              }
              processUpdate++
            } else {
              const process = await Process.create({ processName: trim(rowElement.processName), reportRatio: parseFloat(trim(rowElement.reportRatio)) }, { transaction })
              if (process) {
                for (const itemArrElement of itemArr) {
                  await ProcessItems.create({ processId: process.id, defectiveItemId: itemArrElement }, { transaction })
                }
                for (const num of arr) {
                  await ProcessDept.create({ processId: process.id, deptId: num }, { transaction })
                }
              } else {
                processFailed++
                throw new HttpException('未找到导入中的工序：' + trim(rowElement.processName), 400)
              }
              processSuccess++
            }
          }
          total++
        }
        result = { total, success: processSuccess, update: processUpdate, failed: processFailed }

        return result
      } catch (error) {
        // 如果出现错误，Sequelize 将自动回滚事务
        throw error
      }
    })
  }

  public async batDelete(dto: deleteIdsDto, loadModel) {
    let success = 0
    let failed = 0
    let errors: Array<string> = []
    for (const id of dto.ids) {
      try {
        //先删除子工序
        await Process.destroy({ where: { isChild: 0, parentId: id } })
        const deleteNum = await Process.destroy({ where: { id } })
        if (deleteNum) {
          success++
        } else {
          failed++
        }
      } catch (e) {
        errors.push(`删除工序 ID ${id} 时出错: ${e.message}`)
        failed++
      }
    }
    return { success, failed, errors }
  }

  public async findMaterial(dto: findMaterialDto, id: number, loadModel) {
    const temp = await Process.findByPk(id)
    if (!temp) throw new HttpException('未找到对应工序', 400)
    const route = await ProcessRoute.findAll({
      attributes: ['id'],
      include: [
        {
          association: 'processRouteList',
          where: {
            processId: {
              [Op.eq]: id,
            },
          },
        },
      ],
    })
    //物料数组
    const arr: number[] = route.map(item => item.id)
    const options = {
      attributes: ['id', 'code', 'name'],
      where: {
        processRouteId: {
          [Op.in]: arr,
        },
      },
    }
    if (dto.text) {
      options.where[Op.or] = [{ name: { [Op.like]: `%${dto.text}%` } }, { code: { [Op.like]: `%${dto.text}%` } }]
    }
    const material = await Material.findAll(options)
    return new ResultVO({ material })
  }

  /**
   * 根据工序ID获取下一个工序的托盘列表
   */
  public async findNextProcessPalletList(processId: number, pagination: Pagination) {
    // 1. 获取当前工序信息
    const currentProcess = await Process.findByPk(processId)
    if (!currentProcess) {
      throw new HttpException('当前工序不存在', 400)
    }

    // 2. 确定下一个工序
    let nextProcess: Process = null

    if (currentProcess.isChild === 1) {
      // 当前是子工序，查找下一个子工序或父工序
      const siblingProcesses = await Process.findAll({
        where: {
          parentId: currentProcess.parentId,
          sort: { [Op.gt]: currentProcess.sort },
        },
        order: [['sort', 'ASC']],
        limit: 1,
      })

      if (siblingProcesses.length > 0) {
        // 找到下一个子工序
        nextProcess = siblingProcesses[0]
      } else {
        // 没有下一个子工序，回到父工序
        const parentProcess = await Process.findByPk(currentProcess.parentId)
        if (parentProcess) {
          // 查找父工序的下一个工序
          const nextParentProcesses = await Process.findAll({
            where: {
              parentId: parentProcess.parentId || null,
              sort: { [Op.gt]: parentProcess.sort },
              isChild: 0,
            },
            order: [['sort', 'ASC']],
            limit: 1,
          })
          nextProcess = nextParentProcesses.length > 0 ? nextParentProcesses[0] : null
        }
      }
    } else {
      // 当前是父工序，查找下一个父工序
      const nextParentProcesses = await Process.findAll({
        where: {
          parentId: currentProcess.parentId || null,
          sort: { [Op.gt]: currentProcess.sort },
          isChild: 0,
        },
        order: [['sort', 'ASC']],
        limit: 1,
      })
      nextProcess = nextParentProcesses.length > 0 ? nextParentProcesses[0] : null
    }

    if (!nextProcess) {
      // 没有下一个工序，返回空列表
      return {
        list: [],
        total: 0,
        currentProcess: {
          id: currentProcess.id,
          processName: currentProcess.processName,
          isChild: currentProcess.isChild,
        },
        nextProcess: null,
        message: '当前工序已是最后一道工序',
      }
    }

    console.log(nextProcess.id)

    const teamProcess = await TeamProcess.findOne({
      where: {
        processId: nextProcess.id,
      },
    })

    console.log(teamProcess.teamId)

    const palletOptions: FindPaginationOptions = {
      where: { teamId: teamProcess.teamId },
      pagination,
      include: [
        {
          association: 'pallet',
        },
      ],
      order: [
        ['createdAt', 'DESC'],
        ['id', 'DESC'],
      ],
    }

    // 7. 查询托盘列表
    const palletResult = await Paging.diyPaging(PalletDetail, pagination, palletOptions)

    return {
      ...palletResult,
      currentProcess: {
        id: currentProcess.id,
        processName: currentProcess.processName,
        isChild: currentProcess.isChild,
        sort: currentProcess.sort,
      },
      nextProcess: {
        id: nextProcess.id,
        processName: nextProcess.processName,
        isChild: nextProcess.isChild,
        sort: nextProcess.sort,
      },
    }
  }
}
