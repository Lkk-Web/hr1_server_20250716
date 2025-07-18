import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import { Process } from '@model/pm/process.model'
import { CProcessDto, findMaterialDto, FindPaginationDto, UProcessDto } from './process.dto'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { ProcessItems } from '@model/pm/processItems.model'
import { Aide, JsExclKey } from '@library/utils/aide'
import { Material } from '@model/base/material.model'
import { SYSOrg } from '@model/sys/SYSOrg.model'
import { DefectiveItem } from '@model/quantity/defectiveItem.model'
import { deleteIdsDto } from '@common/dto'
import { ProcessRoute } from '@model/pm/processRoute.model'
import { ProcessDept } from '@model/pm/processDept.model'
import { trim } from 'lodash'
import { POP } from '@model/pe/POP.model'
import { ProcessTask } from '@model/pe/processTask.model'
import { ResultVO } from '@common/resultVO'
import { ProcessRouteList } from '@model/pm/processRouteList.model'
import { ProductionReport } from '@model/pe/productionReport.model'
import { Paging } from '@library/utils/paging'

@Injectable()
export class ProcessService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: Redis,

    @InjectModel(Process)
    private processModel: typeof Process
  ) {}

  public async create(dto: CProcessDto, loadModel) {
    if (dto.processName) {
      const temp = await Process.findOne({ where: { processName: dto.processName } })
      if (temp) {
        throw new HttpException('同名工序已存在', 400)
      }
    }
    const result = await Process.create(dto)
    if (dto.defectiveItems) {
      await ProcessItems.bulkCreate(
        dto.defectiveItems.map(v => ({
          processId: result.id,
          defectiveItemId: v,
        }))
      )
    }

    if (dto.departmentId) {
      await ProcessDept.bulkCreate(
        dto.departmentId.map(num => ({
          processId: result.id,
          deptId: num,
        }))
      )
    }
    return result
  }

  public async edit(dto: UProcessDto, id: number, loadModel) {
    let process = await Process.findOne({ where: { id } })
    if (!process) {
      throw new HttpException('数据不存在', 400006)
    }
    if (dto.processName != process.processName) {
      if (dto.processName) {
        const temp = await Process.findOne({ where: { processName: dto.processName } })
        if (temp) {
          throw new HttpException('同名工序已存在', 400)
        }
      }
    }
    await process.update(dto)
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
    const order = await POP.findOne({ where: { processId: id } })
    const task = await ProcessTask.findOne({ where: { processId: id } })
    const report = await ProductionReport.findOne({ where: { processId: id } })
    if (route || order || task || report) {
      throw new HttpException('该工序已存在后续业务数据（如工艺路线、工单\\任务单\\报工等），不允许删除！', 400)
    }
    const result = await Process.destroy({
      where: {
        id: id,
      },
    })
    return result
  }

  public async find(id: number, loadModel) {
    const options: FindOptions = {
      where: { id },
      include: [
        {
          association: 'processItem',
          attributes: ['id', 'name'],
        },
        {
          association: 'processDept',
          attributes: ['id', 'name'],
          where: {},
        },
      ],
    }
    const result = await Process.findOne(options)
    return result
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, simplify = false) {
    const options: FindPaginationOptions = {
      where: {},
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
    if (dto.isOut != null) {
      options.where['isOut'] = dto.isOut
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
            const dept = await SYSOrg.findOne({ where: { name: deptName } })
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
        const deleteNum = await Process.destroy({ where: { id } })
        if (deleteNum) {
          success++
        } else {
          failed++
        }
      } catch (e) {
        errors.push(`删除物料 ID ${id} 时出错: ${e.message}`)
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
}
