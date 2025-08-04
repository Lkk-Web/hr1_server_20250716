import { Injectable, HttpException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { ProductSerial } from '@model/production/productSerial.model'
import { ProductionOrderTask } from '@model/production/productionOrderTask.model'
import { ProcessTask } from '@model/production/processTask.model'
import { Op, Transaction } from 'sequelize'
import { FindProductSerialDto, UpdateProductSerialDto, UpdateProcessProgressDto } from './productSerial.dto'
import { ProductSerialStatus } from '@common/enum'

@Injectable()
export class ProductSerialService {
  constructor(
    @InjectModel(ProductSerial)
    private readonly productSerialModel: typeof ProductSerial
  ) {}

  /**
   * 分页查询产品序列号
   */
  async findPagination(dto: FindProductSerialDto, pagination: { current: number; pageSize: number }) {
    const { serialNumber, productionOrderTaskId, status, qualityStatus, kingdeeCode } = dto
    const { current, pageSize } = pagination

    const whereCondition: any = {}

    if (serialNumber) {
      whereCondition.serialNumber = { [Op.like]: `%${serialNumber}%` }
    }

    if (productionOrderTaskId) {
      whereCondition.productionOrderTaskId = productionOrderTaskId
    }

    if (status) {
      whereCondition.status = status
    }

    if (qualityStatus) {
      whereCondition.qualityStatus = qualityStatus
    }

    const includeConditions: any[] = [
      {
        association: 'productionOrderTask',
        attributes: ['id', 'orderCode', 'splitQuantity', 'status', 'materialId'],
        include: [
          {
            association: 'material',
            attributes: ['id', 'materialName', 'code', 'spec', 'unit'],
          },
          {
            association: 'productionOrderDetail',
            include: [
              {
                association: 'productionOrder',
              },
            ],
          },
        ],
      },
      {
        association: 'currentProcessTask',
        attributes: ['id', 'processId', 'status'],
        include: [
          {
            association: 'process',
            attributes: ['id', 'processName'],
          },
        ],
        required: false,
      },
    ]

    // 如果有订单编码条件，添加到关联查询中
    if (kingdeeCode) {
      includeConditions[0].include[1].include[0].where = {
        kingdeeCode: { [Op.like]: `%${kingdeeCode}%` },
      }
    }

    const result = await this.productSerialModel.findAndCountAll({
      where: whereCondition,
      include: includeConditions,
      limit: pageSize,
      offset: (current - 1) * pageSize,
      order: [['createdAt', 'DESC']],
    })

    return {
      data: result.rows,
      total: result.count,
      current,
      pageSize,
    }
  }

  /**
   * 根据ID查询产品序列号详情
   */
  async findOne(id: string): Promise<ProductSerial> {
    const productSerial = await this.productSerialModel.findByPk(id, {
      include: [
        {
          association: 'productionOrderTask',
          attributes: ['id', 'orderCode', 'splitQuantity', 'materialId'],
          include: [
            {
              association: 'material',
              attributes: ['id', 'materialName', 'code', 'spec', 'unit'],
            },
            {
              association: 'productionOrderDetail',
              include: [
                {
                  association: 'productionOrder',
                },
              ],
            },
          ],
        },
        {
          association: 'currentProcessTask',
          attributes: ['id', 'processId', 'status'],
          include: [
            {
              association: 'process',
              attributes: ['id', 'processName'],
            },
          ],
          required: false,
        },
      ],
    })

    if (!productSerial) {
      throw new HttpException('产品序列号不存在', 404)
    }

    return productSerial
  }

  /**
   * 更新产品序列号
   */
  async update(id: string, dto: UpdateProductSerialDto): Promise<ProductSerial> {
    const productSerial = await this.findOne(id)

    await productSerial.update(dto)

    return this.findOne(id)
  }

  /**
   * 更新工序进度
   */
  async updateProcessProgress(id: string, dto: UpdateProcessProgressDto): Promise<ProductSerial> {
    const productSerial = await this.findOne(id)

    // 获取当前工序进度
    let processProgress = productSerial.processProgress || []

    // 查找对应的工序进度记录
    const existingProgressIndex = processProgress.findIndex(progress => progress.serialId === dto.processTaskId)

    if (existingProgressIndex >= 0) {
      // 更新现有记录
      processProgress[existingProgressIndex] = {
        ...processProgress[existingProgressIndex],
        status: dto.status,
        actualStartTime: dto.actualStartTime || processProgress[existingProgressIndex].actualStartTime,
        actualEndTime: dto.actualEndTime || processProgress[existingProgressIndex].actualEndTime,
      }
    } else {
      // 添加新记录
      const processTask = await ProcessTask.findByPk(dto.processTaskId, {
        include: [{ association: 'process', attributes: ['processName'] }],
      })

      if (processTask) {
        processProgress.push({
          serialId: productSerial.id,
          processName: processTask.process.processName,
          status: dto.status,
          startTime: processTask.startTime,
          endTime: processTask.endTime,
          actualStartTime: dto.actualStartTime,
          actualEndTime: dto.actualEndTime,
          sort: processProgress.length + 1,
        })
      }
    }

    // 更新产品序列号 工序进度
    await productSerial.update({
      processProgress,
      currentProcessTaskId: dto.processTaskId,
    })

    return this.findOne(id)
  }

  /**
   * 根据生产订单任务ID查询产品序列号
   */
  async findByProductionOrderTaskId(productionOrderTaskId: string): Promise<ProductSerial[]> {
    return await this.productSerialModel.findAll({
      where: { productionOrderTaskId },
      include: [
        {
          association: 'productionOrderTask',
          attributes: ['id', 'orderCode', 'splitQuantity', 'status'],
        },
        {
          association: 'currentProcessTask',
          attributes: ['id', 'processId', 'status'],
          include: [
            {
              association: 'process',
              attributes: ['id', 'processName'],
            },
          ],
          required: false,
        },
      ],
      order: [['serialNumber', 'ASC']],
    })
  }

  /**
   * 批量更新产品序列号状态
   */
  async batchUpdateStatus(ids: string[], status: ProductSerialStatus): Promise<void> {
    await this.productSerialModel.update(
      { status },
      {
        where: {
          id: { [Op.in]: ids },
        },
      }
    )
  }

  /**
   * 删除产品序列号
   */
  async delete(id: string): Promise<void> {
    const productSerial = await this.findOne(id)
    await productSerial.destroy()
  }
}
