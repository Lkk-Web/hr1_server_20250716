import { HttpException, Injectable } from '@nestjs/common'
import _ = require('lodash')
import { CBatchLogDto, FindPaginationDto, UBatchLogDto } from './batchLog.dto'
import { FindOptions, Op } from 'sequelize'
import { BatchLog } from '@model/index'

@Injectable()
export class BatchLogService {
  constructor(
  ) { }

  public async create(dto: CBatchLogDto, loadModel, transaction = null) {
    let result = null
    if (transaction) {
      if (dto.sourceBatch) {
        let resSun = await BatchLog.findAll({ where: { goThereBatch: dto.sourceBatch }, transaction })
        let newResSun = JSON.parse(JSON.stringify(resSun))
        let data = []
        for (let i = 0; i < newResSun.length; i++) {
          let newData = {
            ...dto,
            oneBatch: newResSun[i].oneBatch
          }
          data.push(newData)
        }
        result = await BatchLog.bulkCreate(data, { transaction })
      } else {
        result = await BatchLog.create({ ...dto, oneBatch: dto.goThereBatch }, { transaction })
      }
    } else {
      if (dto.sourceBatch) {
        let resSun = await BatchLog.findAll({ where: { goThereBatch: dto.sourceBatch } })
        let newResSun = JSON.parse(JSON.stringify(resSun))
        let data = []
        for (let i = 0; i < newResSun.length; i++) {
          let newData = {
            ...dto,
            oneBatch: newResSun[i].oneBatch
          }
          data.push(newData)
        }
        result = await BatchLog.bulkCreate(data)
      } else {
        result = await BatchLog.create({ ...dto, oneBatch: dto.goThereBatch })
      }
    }
    return result
  }

  public async edit(dto: UBatchLogDto, id: number, loadModel) {
    let batchLog = await BatchLog.findOne({ where: { id } })
    if (!batchLog) {
      throw new HttpException('数据不存在', 400006)
    }
    await batchLog.update(dto)
    batchLog = await BatchLog.findOne({ where: { id } })
    return batchLog
  }

  public async delete(id: number, loadModel) {
    const result = await BatchLog.destroy({
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
          attributes: ['id', 'code', 'name']
        }, {
          association: 'createdUser',
          attributes: ['id', 'userName'],
          required: false,
        }, {
          association: 'warehouse',
          attributes: ['id', 'name'],
          required: false,
        }
      ]
    }
    const result = await BatchLog.findOne(options)
    return result
  }

  public async findPagination(dto: FindPaginationDto, loadModel) {
    let options: FindOptions = {
      where: {},
      include: [
        {
          association: 'material',
          attributes: ['id', 'code', 'name']
        }, {
          association: 'createdUser',
          attributes: ['id', 'userName'],
          required: false,
        }, {
          association: 'warehouse',
          attributes: ['id', 'name'],
          required: false,
        }
      ]
    }
    if (dto.types == '来源追溯') {
      options.where = { goThereBatch: dto.batch }
    } else {
      options.where = { sourceBatch: dto.batch }
    }
    let res = await BatchLog.findAll(options)
    let newRes = JSON.parse(JSON.stringify(res))
    let oneBatch = []
    let gte = null
    for (let i = 0; i < newRes.length; i++) {
      if (oneBatch.indexOf(newRes[i].oneBatch) == -1) {
        oneBatch.push(newRes[i].oneBatch)
        gte = newRes[0].ywDate
      }
    }
    let options2: FindOptions = {
      where: {},
      include: [
        {
          association: 'material',
          attributes: ['id', 'code', 'name']
        }, {
          association: 'createdUser',
          attributes: ['id', 'userName'],
          required: false,
        }, {
          association: 'warehouse',
          attributes: ['id', 'name'],
          required: false,
        }
      ]
    }
    // 所有溯源批次子集
    if (dto.types == '来源追溯') {
      options2.where = {
        oneBatch: { [Op.in]: oneBatch },
        ywDate: { [Op.lte]: gte }
      }
    } else {
      options2.where = {
        oneBatch: { [Op.in]: oneBatch },
        ywDate: { [Op.gte]: gte }
      }
    }
    let resSun = await BatchLog.findAll(options2)
    let newResSun = JSON.parse(JSON.stringify(resSun))
    // 所有溯源批次子集
    let result = []
    if (dto.types == '来源追溯') {
      for (let i = 0; i < newRes.length; i++) {
        let arr = [newRes[i], ...newResSun]
        let oneOne = this.buildGoThereTree(arr, newRes[i].goThereBatch, 1)
        result.push(oneOne)
      }
    } else {
      for (let i = 0; i < newRes.length; i++) {
        let arr = [newRes[i], ...newResSun]
        let oneOne = this.buildGoThereTree(arr, newRes[i].goThereBatch, 2)
        result.push(oneOne)
      }
    }
    return result
  }

  /**
  * 递归处理溯源数据
  * @menus []- 需要转换的批次集合
  * @parentId string 父批次号，首层不传
  * @type number 1-来源追溯 2-去向追溯
  * @added 数组，用于去重
  */
  private buildGoThereTree(menus, parentId = null, type, added = new Set()) {
    return menus
      .filter(menu => type == 1 ? menu.goThereBatch : menu.sourceBatch === parentId && !added.has(type == 1 ? menu.sourceBatch : menu.goThereBatch))
      .map(menu => {
        added.add(type == 1 ? menu.sourceBatch : menu.goThereBatch); // 标记当前菜单项已添加
        return {
          ...menu,
          children: this.buildGoThereTree(menus, type == 1 ? menu.sourceBatch : menu.goThereBatch, added)
        };
      });
  }
}
