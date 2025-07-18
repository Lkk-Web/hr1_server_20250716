import { Inject, Injectable } from '@nestjs/common'
import { RedisProvider } from '@library/redis'
import { Redis } from 'ioredis'
import { ProcessTask } from '@model/production/processTask.model'
import { materialListDto } from './bom.dto'
import { BOM } from '@model/base/bom.model'
import { BomSubItem } from '@model/base/bomSubItem.model'
import { Aide } from '@library/utils/aide'
import { FindOptions } from 'sequelize'
import { SOP } from '@model/process/SOP.model'
import { Craft } from '@model/io/craft.model'

@Injectable()
export class BomService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: Redis
  ) {}

  public async materialList(dto: materialListDto) {
    // Find the process task with its related order and BOM
    const processTask = await ProcessTask.findByPk(dto.processTaskId, {
      include: [
        {
          association: 'order',
          attributes: ['id', 'bomId'],
        },
      ],
      attributes: ['id'],
    })
    if (!processTask) {
      Aide.throwException(400013)
    }

    return this.getBomWithChildren(processTask.order.bomId)
  }

  private async getBomWithChildren(bomId: number) {
    // Queue to process BOMs in breadth-first order
    const queue = [{ id: bomId, parentIndex: -1, level: 0 }]
    const result = []

    // Process queue until empty
    for (let i = 0; i < queue.length; i++) {
      const { id, parentIndex, level } = queue[i]

      // Get BOM sub items
      const children = await BomSubItem.findAll({
        where: { bomId: id },
        attributes: ['id', 'sort', 'bomId', 'materialId', 'spec', 'attr', 'unit', 'quantity', 'feedProcessId', 'figureNumber', 'subBomCode'],
        include: [
          {
            association: 'parentMaterial',
            attributes: [
              'id',
              'code',
              'attr',
              'category',
              'name',
              'spec',
              'unit',
              'status',
              'k3DrawingNo',
              'k3StandardDrawingNo',
              'k3Meterial',
              'k3AuxUinit',
              'k3Color',
              'k3DataStatus',
            ],
          },
        ],
      })

      // Process each child
      for (const child of children) {
        const childData = child.toJSON()
        childData.items = [] // Initialize empty items array

        // Add to result array
        const currentIndex = result.length
        result.push(childData)

        // Link to parent if not root level
        if (parentIndex !== -1) {
          result[parentIndex].items.push(childData)
        }

        // Check if child has a sub-BOM
        const childBom = await BOM.findOne({
          where: child.subBomCode ? { code: child.subBomCode } : { materialId: child.materialId },
          attributes: ['id', 'code', 'materialId', 'spec', 'attr', 'unit', 'quantity', 'orderNo', 'figureNumber', 'remark', 'version', 'status', 'formData'],
        })

        // If child has a sub-BOM, add to queue for processing
        if (childBom) {
          console.log(childBom.id)
          queue.push({
            id: childBom.id,
            parentIndex: currentIndex,
            level: level + 1,
          })
        }
      }

      // Return top-level items only
      if (i === 0 && children.length === 0) {
        return []
      }
    }

    // Filter to return only top-level items
    const res = result.filter(item => {
      // Check if this item is a child of any other item
      for (const potentialParent of result) {
        if (potentialParent.items && potentialParent.items.some(child => child.id === item.id)) {
          return false
        }
      }
      return true
    })
    res.forEach(v => {
      delete v.items
    })
    return res
  }

  public async sopFind(materialId: number, processId: number) {
    const options: FindOptions = {
      where: { processId },
      include: [
        { association: 'sopMaterial', attributes: [], where: { materialId } },
        {
          association: 'fileList',
          attributes: ['id', 'name', 'url'],
          where: {},
          through: { attributes: [] },
        },
        {
          association: 'process',
          attributes: ['id', 'processName'],
        },
        {
          association: 'createdUser',
          attributes: ['id', 'userName'],
          required: false,
        },
        {
          association: 'updatedUser',
          attributes: ['id', 'userName'],
          required: false,
        },
      ],
    }
    const result = await SOP.findOne(options)
    return result
  }

  //获取工艺
  public async getCraft(code: string) {
    return Craft.findOne({
      where: { code },
      include: [{ association: 'children' }],
    })
  }
}
