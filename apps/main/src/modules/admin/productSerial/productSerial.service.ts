import { Injectable, HttpException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { ProductSerial } from '@model/production/productSerial.model'
import { ProductionOrderTask } from '@model/production/productionOrderTask.model'
import { ProcessTask } from '@model/production/processTask.model'
import { Op, Transaction } from 'sequelize'
import { FindProductSerialDto, UpdateProductSerialDto, UpdateProcessProgressDto } from './productSerial.dto'
import { POSITION_TASK_STATUS, ProductSerialStatus } from '@common/enum'
import { Paging } from '@library/utils/paging'

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

    const includeConditions: any[] = [
      {
        association: 'productionOrderTask',
        attributes: ['id', 'orderCode', 'splitQuantity', 'materialId'],
        where: {},
        include: [
          {
            association: 'material',
            attributes: ['id', 'materialName', 'code', 'spec', 'unit'],
          },
        ],
      },
      {
        association: 'processTasks',
        include: [
          {
            association: 'process',
            attributes: ['id', 'processName'],
          },
          {
            association: 'processPositionTasks',
            where: {},
            include: [
              {
                association: 'process',
                attributes: ['id', 'processName'],
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

    const options = {
      where: whereCondition,
      include: includeConditions,
      offset: (current - 1) * pageSize,
      limit: pageSize,
      order: [['createdAt', 'DESC']],
    }

    if (serialNumber) {
      whereCondition.serialNumber = { [Op.like]: `%${serialNumber}%` }
    }

    if (productionOrderTaskId) {
      whereCondition.productionOrderTaskId = productionOrderTaskId
    }

    if (qualityStatus) {
      whereCondition.qualityStatus = qualityStatus
    }

    if (dto.orderCode) {
      includeConditions[0].where['orderCode'] = {
        [Op.like]: `%${dto.orderCode}%`,
      }
    }

    if (status) {
      includeConditions[1].include[1].where['status'] = status
    } else {
      includeConditions[1].include[1].where['status'] = {
        [Op.in]: [POSITION_TASK_STATUS.NOT_STARTED, POSITION_TASK_STATUS.IN_PROGRESS, POSITION_TASK_STATUS.PAUSED, POSITION_TASK_STATUS.COMPLETED],
      }
    }
    // 如果有订单编码条件，添加到关联查询中
    if (kingdeeCode) {
      includeConditions[0].include[1].include[0].where = {
        kingdeeCode: { [Op.like]: `%${kingdeeCode}%` },
      }
    }

    const result = await Paging.diyPaging(this.productSerialModel, pagination, options)

    return result
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
