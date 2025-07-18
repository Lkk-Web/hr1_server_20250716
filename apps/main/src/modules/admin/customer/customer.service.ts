import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import _ = require('lodash')
import { Customer } from '@model/base/customer.model'
import { CCustomerDto, FindPaginationDto, UCustomerDto } from './customer.dto'
import { Sequelize } from 'sequelize-typescript'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { Paging } from '@library/utils/paging'
import { AdjustOrder } from '@model/wm/adjustOrder.model'

@Injectable()
export class CustomerService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: Redis,

    @InjectModel(Customer)
    private customerModel: typeof Customer,
    private sequelize: Sequelize
  ) {}

  public async create(dto: CCustomerDto, loadModel) {
    const temp = await Customer.findOne({ where: { fullName: dto.fullName } })
    if (temp) throw new HttpException('该全称客户已存在', 400)
    const result = await Customer.create(dto)
    return result
  }

  public async edit(dto: UCustomerDto, id: number, loadModel) {
    let customer = await Customer.findOne({ where: { id } })
    if (!customer) {
      throw new HttpException('数据不存在', 400006)
    }
    const temp = await Customer.findOne({ where: { fullName: dto.fullName, id: { [Op.ne]: id } } })
    if (temp) throw new HttpException('该全称客户已存在', 400)
    await customer.update(dto)
    customer = await Customer.findOne({ where: { id } })
    return customer
  }

  public async delete(id: number, loadModel) {
    const result = await Customer.destroy({
      where: {
        id: id,
      },
    })
    return result
  }

  public async find(id: number, loadModel) {
    const options: FindOptions = {
      where: { id },
      attributes: ['id', 'code', 'types', 'fullName', 'contactPerson', 'contactPhone', 'contactAddress', 'status'],
    }
    const result = await Customer.findOne(options)
    return result
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, loadModel) {
    const options: FindPaginationOptions = {
      where: {},
      attributes: ['id', 'code', 'types', 'fullName', 'contactPerson', 'contactPhone', 'contactAddress', 'status'],
      pagination,
      order: [['id', 'DESC']],
    }
    if (dto.selectAttr) {
      options.where[Op.or] = [
        { shortName: { [Op.like]: `%${dto.selectAttr}%` } },
        { fullName: { [Op.like]: `%${dto.selectAttr}%` } },
        { contactPerson: { [Op.like]: `%${dto.selectAttr}%` } },
        { contactPhone: { [Op.like]: `%${dto.selectAttr}%` } },
      ]
    }
    const result = await Paging.diyPaging(Customer, pagination, options)
    return result
  }
}
