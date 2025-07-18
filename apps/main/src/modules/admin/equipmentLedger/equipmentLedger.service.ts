import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import { CEquipmentLedgerDTO, EquipmentLPaginationDto, UEquipmentLedgerDTO } from './equipmentLedger.dto'
import { EquipmentLedger } from '@model/equipment/equipmentLedger.model'
import { Sequelize } from 'sequelize-typescript'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { CheckOrder } from '@model/equipment/checkOrder.model'
import { InspectionOrder } from '@model/equipment/inspectionOrder.model'
import { RepairOrder } from '@model/equipment/repairOrder.model'
import { Aide, JsExclKey } from '@library/utils/aide'
import { EquipmentType } from '@model/equipment/equipmentType.model'
import { WorkShop } from '@model/base/workShop.model'
import { Supplier } from '@model/base/supplier.model'
import { CheckStandard } from '@model/equipment/checkStandard.model'
import { Equipment } from '@model/equipment/equipment.model'
import { InstallLocation } from '@model/equipment/installLocation.model'
import { InspectionPlan } from '@model/equipment/inspectionPlan.model'
import { Material } from '@model/base/material.model'
import { Paging } from '@library/utils/paging'
import { MaintenanceOrder } from '@model/equipment/maintenanceOrder.model'
import { ScrapOrder } from '@model/equipment/scrapOrder.model'
import { TeamEquipmentLedger } from '@model/schedule/teamEquipmentLedger.model'

@Injectable()
export class EquipmentLedgerService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: Redis,
    @InjectModel(EquipmentLedger)
    private equipmentLedgerModel: typeof EquipmentLedger,
    private sequelize: Sequelize
  ) {}

  public async create(dto: CEquipmentLedgerDTO, user, loadModel) {
    if (dto.code) {
      const temp = await EquipmentLedger.findOne({ where: { code: dto.code } })
      if (temp) throw new HttpException('已存在相同编号设备台账', 400)
    } else {
      const date = new Date()
      const year = date.getFullYear().toString().substring(2)
      const temp = await EquipmentLedger.findOne({
        order: [['id', 'DESC']],
        where: { code: { [Op.like]: `EQ${year}%` } },
      })
      if (temp) {
        const oldNO = temp.code
        const lastFourChars = oldNO.length >= 4 ? oldNO.slice(-4) : '0'.repeat(4 - oldNO.length) + oldNO
        let num = parseInt(lastFourChars)
        num++
        let newNO = num.toString().padStart(4, '0')

        dto.code = 'EQ' + year + newNO
      } else {
        dto.code = 'EQ' + year + '0001'
      }
    }

    const result = await EquipmentLedger.create({ ...dto, createdUserId: user.id, updatedUserId: user.id })
    return result
  }

  public async edit(dto: UEquipmentLedgerDTO, id: number, user, loadModel) {
    let equipmentLedger = await EquipmentLedger.findOne({ where: { id } })
    if (!equipmentLedger) {
      throw new HttpException('数据不存在', 400006)
    }
    await equipmentLedger.update({ ...dto, updatedUserId: user.id })
    equipmentLedger = await EquipmentLedger.findOne({ where: { id } })
    return equipmentLedger
  }

  public async delete(id: number, loadModel) {
    const result = await EquipmentLedger.destroy({
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
          association: 'equipmentType',
          attributes: ['id', 'name'],
        },
        {
          association: 'equipment',
          attributes: ['id', 'name'],
          where: {},
        },
        {
          association: 'file',
          attributes: ['id', 'name', 'url'],
          required: false,
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
        {
          association: 'manufacturer',
          attributes: ['id', 'fullName'],
          required: false,
        },
        {
          association: 'supplier',
          attributes: ['id', 'fullName'],
          where: {},
          required: false,
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
        {
          association: 'checkStandard',
          attributes: ['id', 'code', 'name', 'status'],
          include: [
            {
              association: 'details',
            },
          ],
        },
        {
          association: 'inspectionPlan',
          attributes: ['id', 'code', 'name', 'frequency', 'times', 'status'],
          include: [
            {
              association: 'details',
            },
          ],
        },
        {
          association: 'maintenancePlan',
          attributes: ['id', 'code', 'name', 'frequency', 'status'],
          include: [
            {
              association: 'details',
            },
          ],
        },
      ],
    }
    const result = await EquipmentLedger.findOne(options)
    const datum = result
    const checkOrderArray = []
    const inspectionOrderArray = []
    const repairOrderArray = []
    const maintenanceOrderArray = []
    const scrapOrderArray = []
    const checkOrderTemp = await CheckOrder.findAll({
      where: { equipmentLedgerId: datum.id },
      attributes: ['id', 'equipmentLedgerId', 'checkAt', 'checkUserId', 'result'],
      include: [
        {
          association: 'checkUser',
          attributes: ['id', 'userName'],
          required: false,
        },
        {
          association: 'details',
          attributes: ['id', 'images'],
        },
      ],
    })
    const inspectionOrderTemp = await InspectionOrder.findAll({
      where: { equipmentLedgerId: datum.id },
      attributes: ['id', 'equipmentLedgerId', 'checkAt', 'checkUserId', 'result', 'status'],
      include: [
        {
          association: 'checkUser',
          attributes: ['id', 'userName'],
          required: false,
        },
        {
          association: 'details',
          attributes: ['id', 'images'],
        },
      ],
    })
    const repairOrderTemp = await RepairOrder.findAll({
      where: { equipmentLedgerId: datum.id },
      include: [
        {
          association: 'detail',
          attributes: ['id', 'repairDate'],
        },
        {
          association: 'result',
          attributes: ['id', 'startAt', 'endAt', 'type', 'faultReason', 'repairUserId'],
          include: [
            {
              association: 'repairUser',
              attributes: ['id', 'userName'],
            },
          ],
        },
      ],
    })

    const maintenanceOrderTemp = await MaintenanceOrder.findAll({
      where: { equipmentLedgerId: datum.id },
      include: [
        {
          association: 'maintenanceUser',
          attributes: ['id', 'userName'],
        },
      ],
    })

    const scrapOrderTemp = await ScrapOrder.findAll({
      where: { equipmentLedgerId: datum.id },
      include: [
        {
          association: 'scrapUser',
          attributes: ['id', 'userName', 'departmentId'],
          include: [
            {
              association: 'department',
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
    })

    for (const checkOrder of checkOrderTemp) {
      let images = []
      if (checkOrder && checkOrder.dataValues.details && checkOrder.dataValues.checkUser) {
        for (const detail of checkOrder.dataValues.details) {
          for (const image of detail.images) {
            if (image) {
              images.push(image)
            }
          }
        }
        checkOrderArray.push({
          id: checkOrder.id,
          checkAt: checkOrder.checkAt,
          result: checkOrder.result,
          checkUser: { id: checkOrder.dataValues.checkUser.id, userName: checkOrder.dataValues.checkUser.userName },
          images: images,
        })
      }
    }
    for (const inspectionOrder of inspectionOrderTemp) {
      let images = []
      if (inspectionOrder && inspectionOrder.dataValues.details && inspectionOrder.dataValues.checkUser) {
        for (const detail of inspectionOrder.dataValues.details) {
          for (const image of detail.images) {
            if (image) {
              images.push(image)
            }
          }
        }
        inspectionOrderArray.push({
          id: inspectionOrder.id,
          checkAt: inspectionOrder.checkAt,
          result: inspectionOrder.result,
          checkUser: { id: inspectionOrder.dataValues.checkUser.id, userName: inspectionOrder.dataValues.checkUser.userName },
          status: inspectionOrder.status,
          images: images,
        })
      }
    }
    for (const repairOrder of repairOrderTemp) {
      if (repairOrder && repairOrder.dataValues.detail && repairOrder.dataValues.result) {
        repairOrderArray.push({
          id: repairOrder.id,
          repairDate: repairOrder.dataValues.detail.repairDate,
          startAt: repairOrder.dataValues.result.startAt,
          endAt: repairOrder.dataValues.result.endAt,
          repairUser: { id: repairOrder.dataValues.result.dataValues.repairUser?.id, userName: repairOrder.dataValues.result.dataValues.repairUser?.userName },
          type: repairOrder.dataValues.result.type,
          faultReason: repairOrder.dataValues.result.faultReason,
          status: repairOrder.status,
        })
      }
    }
    for (const maintenanceOrder of maintenanceOrderTemp) {
      maintenanceOrderArray.push({
        id: maintenanceOrder.id,
        maintenanceAt: maintenanceOrder.maintenanceAt,
        result: maintenanceOrder.result,
        nextAt: maintenanceOrder.nextAt,
        maintenanceUser: { id: maintenanceOrder.dataValues.maintenanceUser.id, userName: maintenanceOrder.dataValues.maintenanceUser?.userName },
      })
    }
    for (const scrapOrderTempElement of scrapOrderTemp) {
      scrapOrderArray.push({
        id: scrapOrderTempElement.id,
        code: scrapOrderTempElement.code,
        scrapAt: scrapOrderTempElement.scrapAt,
        equipStatus: scrapOrderTempElement.equipStatus,
        reason: scrapOrderTempElement.reason,
        scrapUser: { id: scrapOrderTempElement.dataValues.scrapUser.id, userName: scrapOrderTempElement.dataValues.scrapUser?.userName },
        dept: { id: scrapOrderTempElement.dataValues.scrapUser.dataValues.department.id, name: scrapOrderTempElement.dataValues.scrapUser.dataValues.department.name },
      })
    }
    datum.setDataValue('checkOrder', checkOrderArray)
    datum.setDataValue('inspectionOrder', inspectionOrderArray)
    datum.setDataValue('repairOrder', repairOrderArray)
    datum.setDataValue('maintenanceOrder', maintenanceOrderArray)
    datum.setDataValue('scrapOrder', scrapOrderArray)
    return result
  }

  public async findPagination(dto: EquipmentLPaginationDto, pagination: Pagination, loadModel) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
      include: [
        {
          association: 'equipmentType',
          attributes: ['id', 'name'],
        },
        {
          association: 'equipment',
          attributes: ['id', 'name'],
          where: {},
        },
        {
          association: 'file',
          attributes: ['id', 'name', 'url'],
          required: false,
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
        {
          association: 'manufacturer',
          attributes: ['id', 'fullName'],
          required: false,
        },
        {
          association: 'supplier',
          attributes: ['id', 'fullName'],
          where: {},
          required: false,
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
        {
          association: 'checkStandard',
          attributes: ['id', 'code', 'name', 'status'],
          include: [
            {
              association: 'details',
            },
          ],
        },
        {
          association: 'inspectionPlan',
          attributes: ['id', 'code', 'name', 'frequency', 'times', 'status'],
          include: [
            {
              association: 'details',
            },
          ],
        },
        {
          association: 'maintenancePlan',
          attributes: ['id', 'code', 'name', 'frequency', 'status'],
          include: [
            {
              association: 'details',
            },
          ],
        },
      ],
    }
    if (dto.code) {
      options.where['code'] = {
        [Op.like]: `%${dto.code}%`,
      }
    }

    if (dto.name) {
      options.include[1].where['name'] = {
        [Op.like]: `%${dto.name}%`,
      }
      options.include[1].required = true
    }

    if (dto.status) {
      options.where['status'] = {
        [Op.eq]: dto.status,
      }
    }

    if (dto.spec) {
      options.where['spec'] = {
        [Op.like]: `%${dto.spec}%`,
      }
    }

    if (dto.workShopName) {
      options.include[3].where['name'] = {
        [Op.like]: `%${dto.workShopName}%`,
      }
      options.include[3].required = true
    }

    if (dto.supplierName) {
      options.include[6].where['fullName'] = {
        [Op.like]: `%${dto.supplierName}%`,
      }
      options.include[6].required = true
    }
    if (dto.filterTeam == 1) {
      const tbName = TeamEquipmentLedger.tableName
      options.where['w2'] = Sequelize.literal(`(select tq.id from ${tbName} as tq where tq.equipmentLedgerId=EquipmentLedger.id limit 1) is null`)
    }
    const result = await Paging.diyPaging(EquipmentLedger, pagination, options)

    // @ts-ignore
    for (const datum of result.data) {
      const checkOrderArray = []
      const inspectionOrderArray = []
      const repairOrderArray = []
      const maintenanceOrderArray = []
      const scrapOrderArray = []
      const checkOrderTemp = await CheckOrder.findAll({
        where: { equipmentLedgerId: datum.id },
        attributes: ['id', 'equipmentLedgerId', 'checkAt', 'checkUserId', 'result'],
        order: [['checkAt', 'ASC']],
        include: [
          {
            association: 'checkUser',
            attributes: ['id', 'userName'],
            required: false,
          },
          {
            association: 'details',
            attributes: ['id', 'images'],
          },
        ],
      })
      const inspectionOrderTemp = await InspectionOrder.findAll({
        where: { equipmentLedgerId: datum.id },
        attributes: ['id', 'equipmentLedgerId', 'checkAt', 'checkUserId', 'result', 'status'],
        order: [['checkAt', 'ASC']],
        include: [
          {
            association: 'checkUser',
            attributes: ['id', 'userName'],
            required: false,
          },
          {
            association: 'details',
            attributes: ['id', 'images'],
          },
        ],
      })
      const repairOrderTemp = await RepairOrder.findAll({
        where: { equipmentLedgerId: datum.id },
        order: [['detail', 'repairDate', 'ASC']],
        include: [
          {
            association: 'detail',
            attributes: ['id', 'repairDate'],
          },
          {
            association: 'result',
            attributes: ['id', 'startAt', 'endAt', 'type', 'faultReason', 'repairUserId'],
            include: [
              {
                association: 'repairUser',
                attributes: ['id', 'userName'],
              },
            ],
          },
        ],
      })

      const maintenanceOrderTemp = await MaintenanceOrder.findAll({
        where: { equipmentLedgerId: datum.id },
        include: [
          {
            association: 'maintenanceUser',
            attributes: ['id', 'userName'],
          },
        ],
      })
      const scrapOrderTemp = await ScrapOrder.findAll({
        where: { equipmentLedgerId: datum.id },
        include: [
          {
            association: 'scrapUser',
            attributes: ['id', 'userName', 'departmentId'],
            include: [
              {
                association: 'department',
                attributes: ['id', 'name'],
              },
            ],
          },
        ],
      })
      for (const checkOrder of checkOrderTemp) {
        let images = []
        if (checkOrder && checkOrder.dataValues.details && checkOrder.dataValues.checkUser) {
          for (const detail of checkOrder.dataValues.details) {
            for (const image of detail.images) {
              if (image) {
                images.push(image)
              }
            }
          }
          checkOrderArray.push({
            id: checkOrder.id,
            checkAt: checkOrder.checkAt,
            result: checkOrder.result,
            checkUser: { id: checkOrder.dataValues.checkUser.id, userName: checkOrder.dataValues.checkUser.userName },
            images: images,
          })
        }
      }
      for (const inspectionOrder of inspectionOrderTemp) {
        let images = []
        if (inspectionOrder && inspectionOrder.dataValues.details && inspectionOrder.dataValues.checkUser) {
          for (const detail of inspectionOrder.dataValues.details) {
            for (const image of detail.images) {
              if (image) {
                images.push(image)
              }
            }
          }
          inspectionOrderArray.push({
            id: inspectionOrder.id,
            checkAt: inspectionOrder.checkAt,
            result: inspectionOrder.result,
            checkUser: { id: inspectionOrder.dataValues.checkUser.id, userName: inspectionOrder.dataValues.checkUser.userName },
            status: inspectionOrder.status,
            images: images,
          })
        }
      }
      for (const repairOrder of repairOrderTemp) {
        if (repairOrder && repairOrder.dataValues.detail && repairOrder.dataValues.result) {
          repairOrderArray.push({
            id: repairOrder.id,
            repairDate: repairOrder.dataValues.detail.repairDate,
            startAt: repairOrder.dataValues.result.startAt,
            endAt: repairOrder.dataValues.result.endAt,
            repairUser: { id: repairOrder.dataValues.result.dataValues.repairUser?.id, userName: repairOrder.dataValues.result.dataValues.repairUser?.userName },
            type: repairOrder.dataValues.result.type,
            faultReason: repairOrder.dataValues.result.faultReason,
            status: repairOrder.status,
          })
        }
      }
      for (const maintenanceOrder of maintenanceOrderTemp) {
        maintenanceOrderArray.push({
          id: maintenanceOrder.id,
          maintenanceAt: maintenanceOrder.maintenanceAt,
          result: maintenanceOrder.result,
          nextAt: maintenanceOrder.nextAt,
          maintenanceUser: { id: maintenanceOrder.dataValues.maintenanceUser.id, userName: maintenanceOrder.dataValues.maintenanceUser?.userName },
        })
      }
      for (const scrapOrderTempElement of scrapOrderTemp) {
        scrapOrderArray.push({
          id: scrapOrderTempElement.id,
          code: scrapOrderTempElement.code,
          scrapAt: scrapOrderTempElement.scrapAt,
          equipStatus: scrapOrderTempElement.equipStatus,
          reason: scrapOrderTempElement.reason,
          scrapUser: { id: scrapOrderTempElement.dataValues.scrapUser.id, userName: scrapOrderTempElement.dataValues.scrapUser?.userName },
          dept: { id: scrapOrderTempElement.dataValues.scrapUser.dataValues.department.id, name: scrapOrderTempElement.dataValues.scrapUser.dataValues.department.name },
        })
      }
      datum.setDataValue('checkOrder', checkOrderArray)
      datum.setDataValue('inspectionOrder', inspectionOrderArray)
      datum.setDataValue('repairOrder', repairOrderArray)
      datum.setDataValue('maintenanceOrder', maintenanceOrderArray)
      datum.setDataValue('scrapOrder', scrapOrderArray)
    }

    return result
  }

  public async importExcel(buffer: Buffer, loadModel) {
    const mapper: JsExclKey[] = [
      {
        keyName: '设备类型', // Excel列的名称
        key: 'equipmentTypeName', // 物料Model类中的属性名
      },
      {
        keyName: '设备名称',
        key: 'equipmentName',
      },
      {
        keyName: '安装地点',
        key: 'installLocate',
      },
      {
        keyName: '设备状态',
        key: 'equipmentStatus',
      },
      {
        keyName: '规格型号',
        key: 'spec',
      },
      {
        keyName: '使用车间',
        key: 'workShopName',
      },
      {
        keyName: '供应商名称',
        key: 'supplierName',
      },
      {
        keyName: '购买日期',
        key: 'purchaseDate',
      },
      {
        keyName: '启用日期',
        key: 'activationDate',
      },
      {
        keyName: '点检标准',
        key: 'checkStandard',
      },
      {
        keyName: '巡检方案',
        key: 'inspectionPlan',
      },
    ]
    let result = {}
    let equipmentLedgerSuccess = 0
    let equipmentLedgerUpdate = 0
    let equipmentLedgerFailed = 0
    let total = 0

    // 将当前Sheet的数据转换为JSON
    const json = await Aide.excelToJson(buffer, mapper)

    const sequelize = await Material.sequelize
    return sequelize.transaction(async transaction => {
      try {
        // 遍历每行数据并保存到数据库
        for (const rowElement of json.row) {
          if (!rowElement.equipmentTypeName || !rowElement.equipmentName || !rowElement.equipmentStatus) {
            equipmentLedgerFailed++
            throw new HttpException('缺少关键字段信息，请按照系统模版导入！', 400)
          }

          const equipmentType = await EquipmentType.findOne({ where: { name: rowElement.equipmentTypeName }, transaction })
          if (!equipmentType) {
            equipmentLedgerFailed++
            throw new HttpException('未找到模板内的设备类型：' + rowElement.equipmentTypeName, 400)
          }

          const equipment = await Equipment.findOne({ where: { name: rowElement.equipmentName }, transaction })
          if (!equipment) {
            equipmentLedgerFailed++
            throw new HttpException('未找到模板内的设备：' + rowElement.equipmentName, 400)
          }

          const workShop = await WorkShop.findOne({ where: { name: rowElement.workShopName }, transaction })

          if (!workShop) {
            equipmentLedgerFailed++
            throw new HttpException('未找到模板内的车间：' + rowElement.workShopName, 400)
          }

          const installLocation = await InstallLocation.findOne({ where: { locate: rowElement.installLocate }, transaction })
          if (!installLocation) {
            equipmentLedgerFailed++
            throw new HttpException('未找到模板内的安装地点：' + rowElement.installLocate, 400)
          }

          const supplier = await Supplier.findOne({ where: { fullName: rowElement.supplierName }, transaction })

          if (!supplier) {
            equipmentLedgerFailed++
            throw new HttpException('未找到模板内的供应商：' + rowElement.supplierName, 400)
          }

          let checkStandard
          if (rowElement.checkStandard && rowElement.checkStandard.length > 0) {
            checkStandard = await CheckStandard.findOne({ where: { name: rowElement.checkStandard }, transaction })
            if (!checkStandard) {
              equipmentLedgerFailed++
              throw new HttpException('未找到模板内的点检标准：' + rowElement.checkStandard, 400)
            }
          }
          let inspectionPlan
          if (rowElement.inspectionPlan && rowElement.inspectionPlan.length > 0) {
            inspectionPlan = await InspectionPlan.findOne({ where: { name: rowElement.inspectionPlan }, transaction })
            if (!inspectionPlan) {
              equipmentLedgerFailed++
              throw new HttpException('未找到模板内的巡检方案：' + rowElement.inspectionPlan, 400)
            }
          }

          //创建设备台账
          const date = new Date()
          const year = date.getFullYear().toString().substring(2)
          let code = ''
          const temp = await EquipmentLedger.findOne({
            order: [['id', 'DESC']],
            where: { code: { [Op.like]: `EQ${year}%` } },
            transaction,
          })
          if (temp) {
            const oldNO = temp.code
            const lastFourChars = oldNO.length >= 4 ? oldNO.slice(-4) : '0'.repeat(4 - oldNO.length) + oldNO
            let num = parseInt(lastFourChars)
            num++
            let newNO = num.toString().padStart(4, '0')

            code = 'EQ' + year + newNO
          } else {
            code = 'EQ' + year + '0001'
          }

          await EquipmentLedger.create(
            {
              code: code,
              equipmentTypeId: equipmentType.id,
              equipmentId: equipment.id,
              status: rowElement.equipmentStatus,
              spec: rowElement.spec,
              workShopId: workShop.id ? workShop.id : null,
              installLocationId: installLocation.id ? installLocation.id : null,
              supplierId: supplier.id ? supplier.id : null,
              purchaseDate: rowElement.purchaseDate ? rowElement.purchaseDate : null,
              activationDate: rowElement.activationDate ? rowElement.activationDate : null,
              checkStandardId: checkStandard.id ? checkStandard.id : null,
              inspectionPlanId: inspectionPlan.id ? inspectionPlan.id : null,
            },
            { transaction }
          )
          equipmentLedgerSuccess++

          total++
        }
        result = { total, success: equipmentLedgerSuccess, update: equipmentLedgerUpdate, failed: equipmentLedgerFailed }
        return result
      } catch (error) {
        // 如果出现错误，Sequelize 将自动回滚事务
        throw error
      }
    })
  }
}
