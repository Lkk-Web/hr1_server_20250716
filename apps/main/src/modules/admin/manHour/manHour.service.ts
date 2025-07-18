import { Injectable } from '@nestjs/common'
import { CBatchManHourDto, CHourProcessDto, CManHourDto, ManHourPageDto } from './manHour.dto'
import { ManHour } from '@model/performance/manHour.model'
import { ManHourProcess } from '@model/performance/manHourProcess.model'
import { Material } from '@model/base/material.model'
import { Process } from '@model/process/process.model'
import { Aide } from '@library/utils/aide'
import { PERFORMANCE_CONFIG_TYPE } from '@common/enum'
import { Pagination } from '@common/interface'
import { FindPaginationOptions } from '@model/shared/interface'
import { Op } from 'sequelize'
import { validateTransform } from '@core/pipe'
import _ = require('lodash')
import dayjs = require('dayjs')
import E from '@common/error'

@Injectable()
export class ManHourService {
  constructor() {}

  public async createOrUpdate(dto: CBatchManHourDto, userID: number) {
    //循环检测开始时间时间是否错误
    dto.list.forEach(temp => {
      if (!temp.id) {
        //时间不能小于明天
        if (dayjs().add(1, 'day').diff(temp.startDate, 'day') > 0) Aide.throwException(400, '时间不能小于明天')
      }
    })
    //数据校验 物料是否存在
    const materialIds = _.uniq(dto.list.map(item => item.materialId))
    const materials = await Material.findAll({
      where: {
        id: materialIds,
      },
      attributes: ['id'],
    })
    if (materials.length != materialIds.length) Aide.throwException(400014)
    const processIds = _.uniq(_.flattenDeep(dto.list.map(item => item.processList.map(p => p.processId))))

    const processes = await Process.findAll({
      where: {
        id: processIds,
      },
      attributes: ['id'],
    })
    if (processes.length != processIds.length) Aide.throwException(400016)

    //获取物料所有的工时配置
    const manHourList = await ManHour.findAll({
      where: {
        materialId: materialIds,
      },
      attributes: ['id', 'materialId', 'startDate', 'endDate'],
      include: [{ association: 'manHourProcess', attributes: ['id', 'processId', 'canonNum'] }],
    })
    manHourList.sort((a, b) => b.id - a.id)
    const createMHP: CHourProcessDto[] = []
    const upData: any[] = []
    const createManHour: CManHourDto[] = []
    //更新或创建处理数据
    dto.list.forEach(item => {
      const manHour = item.id ? manHourList.find(m => m.id == item.id) : null
      if (item.id && !manHour) {
        Aide.throwException(400, `工时配置不存在:${item.id}`)
      }
      if (!manHour) {
        //检测时间不能小于最后一条记录的时间
        const tempDate = manHourList.find(v => v.materialId == item.materialId)?.startDate
        if (dayjs(item.startDate).isBefore(tempDate)) {
          Aide.throwException(400, `${item.type},工时配置时间不能小于最后一条记录的时间:${dayjs(tempDate).format('YYYY-MM-DD')}`)
        }
        createManHour.push({
          ...item,
          createById: userID,
          startDate: dayjs(item.startDate).startOf('day').valueOf(),
        })
      }
      item.processList.forEach(temp => {
        const manHourProcess = manHour ? manHour.manHourProcess.find(v => v.processId == temp.processId) : null
        if (manHourProcess) {
          upData.push({
            id: manHourProcess.id,
            canonNum: temp.canonNum,
            manHourId: manHour.id,
            processId: manHourProcess.processId,
          })
        } else if (manHour && !manHourProcess) {
          createMHP.push({
            ...temp,
            manHourId: manHour.id,
          })
        }
      })
    })
    // return { upData,createMHP }
    if (createManHour.length) {
      const types: PERFORMANCE_CONFIG_TYPE[] = []
      const criteriaList = createManHour.filter(v => v.type == PERFORMANCE_CONFIG_TYPE.criteria)
      const salesList = createManHour.filter(v => v.type == PERFORMANCE_CONFIG_TYPE.sales)
      const outList = createManHour.filter(v => v.type == PERFORMANCE_CONFIG_TYPE.out)
      //同一个类型只能创建一个
      if (criteriaList.length > 1 || outList.length > 1 || salesList.length > 1) Aide.throwException(400, `一个工时配置类型，同时只能创建一个`)
      if (criteriaList.length) {
        types.push(PERFORMANCE_CONFIG_TYPE.criteria)
      }
      if (salesList.length) {
        types.push(PERFORMANCE_CONFIG_TYPE.sales)
      }
      if (outList.length) {
        types.push(PERFORMANCE_CONFIG_TYPE.out)
      }
      await Promise.all([
        criteriaList.length
          ? ManHour.update(
              {
                endDate: dayjs(criteriaList[0].startDate || new Date()).format('YYYY-MM-DD 23:59:59'),
              },
              { where: { materialId: materialIds, endDate: null, type: PERFORMANCE_CONFIG_TYPE.criteria } }
            )
          : null,
        salesList.length
          ? ManHour.update(
              {
                endDate: dayjs(salesList[0].startDate || new Date()).format('YYYY-MM-DD 23:59:59'),
              },
              { where: { materialId: materialIds, endDate: null, type: PERFORMANCE_CONFIG_TYPE.sales } }
            )
          : null,
        outList.length
          ? ManHour.update(
              {
                endDate: dayjs(outList[0].startDate || new Date()).format('YYYY-MM-DD 23:59:59'),
              },
              { where: { materialId: materialIds, endDate: null, type: PERFORMANCE_CONFIG_TYPE.out } }
            )
          : null,
      ])
      const manHours = await ManHour.bulkCreate(createManHour)
      const createManHourProcess: CHourProcessDto[] = []
      for (let i = 0; i < createManHour.length; i++) {
        const temp = createManHour[i]
        const manHour = manHours[i]
        createManHourProcess.push(
          ...temp.processList.map(v => ({
            ...v,
            manHourId: manHour.id,
          }))
        )
      }
      await ManHourProcess.bulkCreate(createManHourProcess)
    }

    const upManHour = dto.list.filter(item => item.id)
    await Promise.all([
      createMHP.length ? ManHourProcess.bulkCreate(createMHP) : null,
      upData.length
        ? ManHourProcess.bulkCreate(upData, {
            updateOnDuplicate: ['canonNum'],
          })
        : null,
      upManHour.length
        ? ManHour.bulkCreate(upManHour, {
            updateOnDuplicate: ['unit', 'type', 'desc'],
          })
        : null,
    ])

    return true
  }

  public async findPagination(dto: ManHourPageDto, pagination: Pagination) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
      include: [{ association: 'manHours', where: { endDate: null }, include: [{ association: 'manHourProcess' }] }],
      attributes: {
        exclude: ['formData', 'k3Meterial', 'k3AuxUinit', 'k3DataStatus', 'minimumInventory', 'maximumInventory', 'safetyInventory', 'quantity', 'batNumber'],
      },
    }
    if (dto.materialName) {
      options.where['name'] = {
        [Op.like]: `%${dto.materialName}%`,
      }
    }
    if (dto.type) {
      options.include[0]['where']['type'] = dto.type
    }
    const result = await Material.findPagination<Material>(options)
    //查询最新的
    return result
  }

  public async find(id: number) {
    return Material.findOne({
      where: { id },
      include: [{ association: 'manHours', include: [{ association: 'manHourProcess' }] }],
      attributes: {
        exclude: ['formData', 'k3Meterial', 'k3AuxUinit', 'k3DataStatus', 'minimumInventory', 'maximumInventory', 'safetyInventory', 'quantity', 'batNumber'],
      },
    })
  }

  //导入工时配置
  public async import(file: Express.Multer.File, userID: number) {
    const data = await Aide.excelToJsonSmooth(file.buffer)
    //转换数据为CManHourDto[]
    const list: CManHourDto[] = []
    data.forEach(item => {
      const criteriaObj = item['标准工时']
      const salesObj = item['售后工时']
      const outObj = item['委外工时']
      if (criteriaObj) {
        list.push(this.handlData(item, criteriaObj, PERFORMANCE_CONFIG_TYPE.criteria))
      }
      if (salesObj) {
        list.push(this.handlData(item, salesObj, PERFORMANCE_CONFIG_TYPE.sales))
      }
      if (outObj) {
        list.push(this.handlData(item, outObj, PERFORMANCE_CONFIG_TYPE.out))
      }
    })
    //查询所有物料
    const codes = _.uniq(list.map(item => item.code))
    const materials = await Material.findAll({
      where: {
        code: codes,
      },
      attributes: ['id', 'code'],
    })
    //检测物料是否存在
    const errorCodeList = []
    list.forEach(item => {
      const material = materials.find(v => v.code == item.code)
      if (!material) {
        errorCodeList.push(item.code)
      } else {
        item.materialId = material.id
        delete item.code
      }
    })
    if (errorCodeList.length) {
      Aide.throwException(400, `物料不存在:${_.uniq(errorCodeList).join(',')}`)
    }
    const processList = await Process.findAll({
      attributes: ['id', 'processName'],
    })
    //检测工序是否存在
    const errorList = []
    list.forEach(item => {
      item.processList.forEach(temp => {
        // @ts-ignore
        const process = processList.find(v => v.processName == temp.processId)
        if (!process) {
          errorList.push(temp.processId)
        } else {
          temp.processId = process.id
        }
      })
    })
    if (errorList.length) {
      Aide.throwException(400, `工序不存在:${_.uniq(errorList).join(',')}`)
    }
    //启用数据验证
    await validateTransform({ list }, CBatchManHourDto)
    //循环添加
    //分组同一个物料id为一组
    const groupMap = _.groupBy(list, item => item.materialId)
    const groupList: CManHourDto[][] = []
    Object.keys(groupMap).forEach(item => {
      groupList.push(groupMap[item] as CManHourDto[])
    })

    const result = { total: groupList.length, success: 0, update: 0, failed: 0, errors: [] }
    for (let i = 0; i < groupList.length; i++) {
      try {
        await this.createOrUpdate({ list: groupList[i] }, userID)
        result.success++
      } catch (e) {
        console.log(e)
        const material = materials.find(v => v.id == groupList[i][0].materialId)

        result.errors.push(material?.code + '，失败原因:' + e.response)
        result.failed++
      }
    }
    return result
  }

  //导入工时数据处理
  private handlData(item: any, obj: any, type: PERFORMANCE_CONFIG_TYPE): CManHourDto {
    // @ts-ignore
    const criteriaList: CHourProcessDto[] = Object.keys(obj)
      .filter(v => v != '单位')
      .map(key => {
        return {
          processId: key,
          canonNum: Number(obj[key]),
        }
      })
    return {
      code: item['物料编码'],
      startDate: item['生效起始日期'],
      unit: obj['单位'],
      type,
      processList: criteriaList,
    }
  }
}
