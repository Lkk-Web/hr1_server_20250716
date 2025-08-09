import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import { ProcessRoute } from '@model/process/processRoute.model'
import { CProcessRouteDto, FindPaginationDto, UProcessRouteDto } from './processRoute.dto'
import { FindOptions, Op, Sequelize } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { deleteIdsDto } from '@common/dto'
import { Process } from '@model/process/process.model'
import { Material } from '@model/base/material.model'
import { ProcessRouteList } from '@model/process/processRouteList.model'
import { DefectiveItem } from '@model/quantity/defectiveItem.model'
import { ProcessRouteListItem } from '@model/process/processRouteListItem.model'
import { Aide, JsExclKey } from '@library/utils/aide'
import { User } from '@model/auth/user'
import { Paging } from '@library/utils/paging'
import { ProductSerial } from '@model/production/productSerial.model'

@Injectable()
export class ProcessRouteService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: Redis,

    @InjectModel(ProcessRoute)
    private processRouteModel: typeof ProcessRoute
  ) {}

  public async create(dto: CProcessRouteDto, user: User, loadModel) {
    // let temp = await ProcessRoute.findOne({ where: { materialId: dto.materialId, status: true } })
    // if (temp) {
    //   const material = await Material.findOne({ where: { id: dto.materialId } })
    //   throw new HttpException('产品:' + material.name + '已被其他工艺路线关联,请选择其他产品', 400)
    // }

    const processRoute = await ProcessRoute.findOne({ where: { name: dto.name } })
    if (processRoute) {
      throw new HttpException('工艺路线名称已存在', 400)
    }
    //建立外层工艺路线
    const result = await ProcessRoute.create({ name: dto.name, remark: dto.remark, status: dto.status, createdUserId: user.id })
    if (dto.processRouteList) {
      //关联内部工序列表
      for (const processRouteList of dto.processRouteList) {
        const processId = (processRouteList as any).processId ?? (processRouteList as any).process?.id
        if (!processId) {
          throw new HttpException('工序ID为空或未提供: 请传入 processId 或 process.id', 400)
        }
        const process = await Process.findOne({ where: { id: processId } })
        if (process) {
          const list = await ProcessRouteList.create({
            processId: process.id,
            processRouteId: result.id,
            reportRatio: processRouteList.reportRatio,
            isOutsource: processRouteList.isOutsource,
            isReport: processRouteList.isReport,
            fileId: processRouteList.fileId,
            sort: processRouteList.sort,
            isInspection: processRouteList.isInspection,
          })
          //关联工序列表的不良品项
          if (processRouteList.items) {
            for (const listElement of processRouteList.items) {
              // @ts-ignore
              const item = await DefectiveItem.findOne({ where: { id: listElement } })
              if (item) {
                await ProcessRouteListItem.create({ processRouteListId: list.id, defectiveItemId: item.id })
              } else {
                throw new HttpException('不良品项ID:' + listElement + '不存在!请重新选择', 400)
              }
            }
          }
        } else {
          throw new HttpException('ID为:' + processId + '的工序不存在!请重新选择', 400)
        }
      }
    }
    console.log(dto.materialId)
    await Material.update({ processRouteId: result.id }, { where: { id: dto.materialId } })
    return this.find(result.id, loadModel)
  }

  public async edit(dto: UProcessRouteDto, id: number, user: User, loadModel) {
    console.log(id)
    let processRoute = await ProcessRoute.findOne({ where: { id } })
    if (!processRoute) {
      throw new HttpException('数据不存在', 400006)
    }
    // if (dto.name != processRoute.name) {
    //   let temp = await ProcessRoute.findOne({ where: { materialId: dto.materialId, status: true } })
    //   if (temp && temp.id != id) {
    //     const material = await Material.findOne({ where: { id: dto.materialId } })
    //     throw new HttpException('产品:' + material.name + '已被其他工艺路线关联,请选择其他产品', 400)
    //   }
    // }

    // if (dto.status) {
    //   const temp = await ProcessRoute.findOne({ where: { materialId: dto.materialId, status: true } })
    //   if (temp && temp.id != id) {
    //     throw new HttpException('已有相同的工序路线并启用,无法启用该条路线', 400)
    //   }
    // }
    await processRoute.update({ ...dto, updatedUserId: user.id })

    // 处理物料关联：先解绑已不在列表中的物料，再绑定新的物料
    const newMaterialIds: number[] = Array.isArray(dto.materialId) ? dto.materialId : dto.materialId != null ? [dto.materialId as unknown as number] : []

    if (newMaterialIds.length > 0) {
      // 需要被解绑的物料列表（现绑定在该路线但不在新列表中）
      const materialsToUnbind = await Material.findAll({
        where: { processRouteId: id, id: { [Op.notIn]: newMaterialIds } },
        attributes: ['id', 'code', 'materialName'],
      })

      if (materialsToUnbind.length > 0) {
        const unbindIds = materialsToUnbind.map(m => m.id)
        const blocked = await ProductSerial.findAll({
          where: { materialId: { [Op.in]: unbindIds } },
          attributes: ['materialId'],
          group: ['materialId'],
        })

        if (blocked.length > 0) {
          const blockedIdSet = new Set(blocked.map(b => (b as any).materialId))
          const blockedTips = materialsToUnbind
            .filter(m => blockedIdSet.has(m.id))
            .map(m => `${m.code || m.id}${m['materialName'] ? `(${m['materialName']})` : ''}`)
            .join(', ')
          throw new HttpException(`以下物料已关联产品序列单，禁止解除绑定：${blockedTips}`, 400)
        }
      }

      // 执行解绑未被阻止的物料
      await Material.update({ processRouteId: null }, { where: { processRouteId: id, id: { [Op.notIn]: newMaterialIds } } })

      // 绑定新列表中的物料
      await Material.update({ processRouteId: id }, { where: { id: newMaterialIds } })
    } else {
      // 若未传 materialId 或为空数组，则尝试解绑该路线下的所有物料，但需校验是否存在产品序列单关联
      const boundMaterials = await Material.findAll({
        where: { processRouteId: id },
        attributes: ['id', 'code', 'materialName'],
      })

      if (boundMaterials.length > 0) {
        const boundIds = boundMaterials.map(m => m.id)
        const blocked = await ProductSerial.findAll({
          where: { materialId: { [Op.in]: boundIds } },
          attributes: ['materialId'],
          group: ['materialId'],
        })

        if (blocked.length > 0) {
          const blockedIdSet = new Set(blocked.map(b => (b as any).materialId))
          const blockedTips = boundMaterials
            .filter(m => blockedIdSet.has(m.id))
            .map(m => `${m.code || m.id}${m['materialName'] ? `(${m['materialName']})` : ''}`)
            .join(', ')
          throw new HttpException(`以下物料已关联产品序列单，禁止解除绑定：${blockedTips}`, 400)
        }
      }

      await Material.update({ processRouteId: null }, { where: { processRouteId: id } })
    }

    //删除依赖关系
    const list = await ProcessRouteList.findAll({ where: { processRouteId: id } })
    for (const processRouteList of list) {
      await ProcessRouteListItem.destroy({ where: { processRouteListId: processRouteList.id } })
    }
    await ProcessRouteList.destroy({ where: { processRouteId: id } })

    if (dto.processRouteList) {
      //关联内部工序列表
      for (const processRouteList of dto.processRouteList) {
        const processId = (processRouteList as any).processId ?? (processRouteList as any).process?.id
        if (!processId) {
          throw new HttpException('工序ID为空或未提供: 请传入 processId 或 process.id', 400)
        }
        const process = await Process.findOne({ where: { id: processId } })
        if (process) {
          const list = await ProcessRouteList.create({
            processId: process.id,
            processRouteId: id,
            reportRatio: processRouteList.reportRatio,
            isOutsource: processRouteList.isOutsource,
            isInspection: processRouteList.isInspection,
            isReport: processRouteList.isReport,
            fileId: processRouteList.fileId,
            sort: processRouteList.sort,
          })
          //关联工序列表的不良品项
          if (processRouteList.items) {
            for (const listElement of processRouteList.items) {
              // @ts-ignore
              const item = await DefectiveItem.findOne({ where: { id: listElement } })
              if (item) {
                await ProcessRouteListItem.create({ processRouteListId: list.id, defectiveItemId: item.id })
              } else {
                throw new HttpException('不良品项ID:' + listElement + '不存在!请重新选择', 400)
              }
            }
          }
        } else {
          throw new HttpException('ID为:' + processId + '的工序不存在!请重新选择', 400)
        }
      }
    }

    return this.find(id, loadModel)
  }

  public async delete(id: number, loadModel) {
    // 校验：若有物料关联该工艺路线，则不允许删除
    const relatedMaterial = await Material.findOne({ where: { processRouteId: id } })
    if (relatedMaterial) {
      throw new HttpException('工艺路线绑定物料，无法删除！', 400)
    }
    //删除依赖关系
    const list = await ProcessRouteList.findAll({ where: { processRouteId: id } })
    for (const processRouteList of list) {
      await ProcessRouteListItem.destroy({ where: { processRouteListId: processRouteList.id } })
    }
    await ProcessRouteList.destroy({ where: { processRouteId: id } })

    const result = await ProcessRoute.destroy({
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
          association: 'material',
          attributes: ['id', 'code', 'materialName', 'attribute', 'spec', 'unit'],
        },
        {
          association: 'createdUser',
          attributes: ['id', 'userName'],
        },
        {
          association: 'updatedUser',
          attributes: ['id', 'userName'],
        },
        {
          association: 'processRouteList',
          attributes: ['id', 'isReport', 'isOutsource', 'isInspection'],
          include: [
            {
              association: 'process',
              attributes: ['id', 'processName'],
              include: [
                {
                  association: 'children',
                  attributes: [
                    'id',
                    'processName',
                    'sort',
                    [
                      Sequelize.literal(`(
                      SELECT COUNT(DISTINCT pli.id)
                      FROM process_locate_item pli
                      INNER JOIN process_position_task pt ON pli.processPositionTaskId = pt.id
                      WHERE pt.processId = \`processRouteList->process->children\`.\`id\`
                    )`),
                      'totalAssignedCount',
                    ],
                  ],
                },
              ],
            },
            // {
            //   association: 'items',
            //   include: [
            //     {
            //       association: 'defectiveItem',
            //     },
            //   ],
            // },
          ],
        },
      ],
    }
    const result = await ProcessRoute.findOne(options)
    return result
  }

  public async copy(id: number, loadModel) {
    const options: FindOptions = {
      where: { id },
      include: [
        {
          association: 'material',
          attributes: ['id', 'code', 'materialName'],
        },
        {
          association: 'createdUser',
          attributes: ['id', 'userName'],
        },
        {
          association: 'updatedUser',
          attributes: ['id', 'userName'],
        },
        {
          association: 'processRouteList',
          // attributes: ['id'],
          include: [
            {
              association: 'process',
              attributes: ['id', 'processName'],
              include: [
                {
                  association: 'children',
                  attributes: ['id', 'processName'],
                },
              ],
            },
            {
              // 工序自带的不良品项
              association: 'items',
              attributes: ['id', 'defectiveItemId'],
            },
          ],
        },
      ],
    }
    const result = await ProcessRoute.findOne(options)

    let processRoute

    if (result) {
      const sequelize = ProcessRoute.sequelize
      await sequelize.transaction(async transaction => {
        // 先生成工艺路线
        processRoute = await ProcessRoute.create(
          {
            name: result.name + '-副本',
            status: false,
            remark: result.dataValues.remark,
            createdUserId: result.dataValues.createdUserId,
            updatedUserId: result.dataValues.updatedUserId,
          },
          { transaction }
        )

        // 创建关联关系
        for (const list of result.dataValues.processRouteList) {
          const list1 = await ProcessRouteList.create(
            {
              processRouteId: processRoute.dataValues.id,
              processId: list.dataValues.processId,
              isOutsource: list.dataValues.isOutsource,
              isReport: list.dataValues.isReport,
              isInspection: list.dataValues.isInspection,
              sort: list.dataValues.sort,
              reportRatio: list.dataValues.reportRatio,
              fileId: list.dataValues.fileId,
            },
            { transaction }
          )

          // 复制不良品项
          if (list.items && Array.isArray(list.items) && list.items.length > 0) {
            for (const item of list.items) {
              await ProcessRouteListItem.create({ processRouteListId: list1.dataValues.id, defectiveItemId: item.dataValues.defectiveItemId }, { transaction })
            }
          }
        }

        // 注意：复制工艺路线时不变更原有物料与工艺路线的绑定关系
      })
    } else {
      throw new HttpException('所选择的工艺路线不存在,无法复制', 400)
    }
    return this.find(processRoute.id, loadModel)
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, loadModel) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
      include: [
        {
          association: 'material',
          attributes: ['id', 'code', 'materialName'],
          where: {},
          required: false,
        },
        {
          association: 'createdUser',
          attributes: ['id', 'userName'],
        },
        {
          association: 'updatedUser',
          attributes: ['id', 'userName'],
        },
        {
          association: 'processRouteList',
          attributes: ['id', 'sort'],
          include: [
            {
              //工序自带的不良品项
              association: 'process',
              attributes: ['id', 'processName'],
              include: [
                {
                  association: 'children',
                  attributes: ['id', 'processName', 'reportRatio', 'isOut', 'createdAt', 'updatedAt', 'isChild', 'parentId'],
                  required: false,
                },
              ],
            },

            // {
            //   association: 'file',
            //   attributes: ['id', 'name', 'versionCode', 'url'],
            //   where: {},
            //   required: false,
            // },
          ],
        },
      ],
    }

    if (dto.status) {
      const statusString = String(dto.status).toLowerCase().trim() // 确保字符串统一处理
      const statusBoolean = statusString === 'true' || statusString === '1' // 转换逻辑
      options.where['status'] = {
        [Op.eq]: statusBoolean,
      }
    }

    if (dto.materialName) {
      options.include[0].where['name'] = {
        [Op.like]: `%${dto.materialName}%`,
      }
    }

    if (dto.name) {
      options.where['name'] = {
        [Op.like]: `%${dto.name}%`,
      }
    }
    if (dto.materialId) {
      options.include[0].where['id'] = {
        [Op.eq]: dto.materialId,
      }
    }

    const result = await Paging.diyPaging(ProcessRoute, pagination, options)

    return result
  }

  public async batDelete(dto: deleteIdsDto, loadModel) {
    let success = 0
    let failed = 0
    let errors: Array<string> = []
    for (const id of dto.ids) {
      try {
        // 校验：若有物料关联该工艺路线，则不允许删除
        const relatedMaterial = await Material.findOne({ where: { processRouteId: id } })
        if (relatedMaterial) {
          failed++
          errors.push(`工艺路线 ID ${id}：存在物料关联，禁止删除`)
          continue
        }

        // 先删除依赖关系
        const list = await ProcessRouteList.findAll({ where: { processRouteId: id } })
        for (const processRouteList of list) {
          await ProcessRouteListItem.destroy({ where: { processRouteListId: processRouteList.id } })
        }
        await ProcessRouteList.destroy({ where: { processRouteId: id } })

        const deleteNum = await ProcessRoute.destroy({ where: { id } })
        if (deleteNum) {
          success++
        } else {
          failed++
        }
      } catch (e) {
        errors.push(`删除工艺路线 ID ${id} 时出错: ${e.message}`)
        failed++
      }
    }
    return { success, failed, errors }
  }

  public async importExcel(buffer: Buffer, loadModel) {
    const mapper: JsExclKey[] = [
      {
        keyName: '工艺路线名称', // Excel列的名称
        key: 'name', // 物料Model类中的属性名
      },
      {
        keyName: '工序/工艺路线列表',
        key: 'list',
      },
      {
        keyName: '关联产品编号',
        key: 'materialCode',
      },
    ]
    let result = {}
    let processRouteSuccess = 0
    let processRouteUpdate = 0
    let processRouteFailed = 0
    let total = 0
    let errors: Array<string> = []

    // 将当前Sheet的数据转换为JSON
    const json = await Aide.excelToJson(buffer, mapper)

    const sequelize = ProcessRoute.sequelize
    return sequelize.transaction(async transaction => {
      try {
        // 遍历每行数据并保存到数据库
        outLoop: for (const rowElement of json.row) {
          try {
            console.log(rowElement)
            // 创建工艺路线
            const processRoute = await ProcessRoute.create({ name: rowElement.name }, { transaction })
            if (!processRoute) {
              throw new HttpException('未知错误,工艺路线创建失败', 400)
            }
            processRouteSuccess++

            // 处理多个物料编码
            const materialCodes = rowElement.materialCode.split(',')
            for (const code of materialCodes) {
              const material = await Material.findOne({ where: { code: code.trim() } })
              if (!material) {
                errors.push(`未找到物料:${code}`)
                continue
              }
              material.processRouteId = processRoute.id
              await material.save({ transaction })
            }
            //截取工序名称
            const str = rowElement.list.split(',')
            let sort = 1
            for (const strElement of str) {
              const process = await Process.findOne({
                where: { processName: strElement },
                include: [{ association: 'processItem', attributes: ['id'], through: { attributes: [] } }],
              })
              if (process) {
                const list = await ProcessRouteList.create(
                  { processRouteId: processRoute.id, processId: process.id, sort, isInspection: false, isOutsource: false },
                  { transaction }
                )
                for (const defectiveItem of process.dataValues.processItem) {
                  await ProcessRouteListItem.create({ processRouteListId: list.id, defectiveItemId: defectiveItem.id }, { transaction })
                }
                sort++
              } else {
                processRouteFailed++
                continue outLoop
              }
            }
          } catch (e) {
            processRouteFailed++
            errors.push(e)
          }
          total++
        }
        result = { total, success: processRouteSuccess, update: processRouteUpdate, failed: processRouteFailed, errors }
        return result
      } catch (error) {
        // 如果出现错误，Sequelize 将自动回滚事务
        throw error
      }
    })
  }
}
