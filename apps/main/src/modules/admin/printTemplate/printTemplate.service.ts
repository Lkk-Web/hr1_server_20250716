import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import _ = require('lodash')
import { PrintTemplate } from '@model/sys/printTemplate.model'
import { CPrintTemplateDto, FindPaginationDto, UPrintTemplateDto } from './printTemplate.dto'
import { FindOptions } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'

@Injectable()
export class PrintTemplateService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: Redis,

    @InjectModel(PrintTemplate)
    private printTemplateModel: typeof PrintTemplate
  ) { }

  public async create(dto: CPrintTemplateDto, loadModel) {
    if (dto.templateName) {
      const template = await PrintTemplate.findOne({ where: { templateName: dto.templateName } })
      if (template) {
        throw new HttpException('同名打印模板已存在', 400)
      }
    }
    const result = await PrintTemplate.create(dto)
    return result
  }

  public async edit(dto: UPrintTemplateDto, id: number, loadModel) {
    let printTemplate = await PrintTemplate.findOne({ where: { id } })
    if (!printTemplate) {
      throw new HttpException('数据不存在', 400006)
    }
    if (dto.templateName != printTemplate.templateName) {
      const template = await PrintTemplate.findOne({ where: { templateName: dto.templateName } })
      if (template) {
        throw new HttpException('同名打印模板已存在', 400)
      }
    }
    await printTemplate.update(dto)
    printTemplate = await PrintTemplate.findOne({ where: { id } })
    return printTemplate
  }

  public async delete(id: number, loadModel) {
    const result = await PrintTemplate.destroy({
      where: {
        id: id,
      },
    })
    return result
  }

  public async find(id: number, loadModel) {
    const options: FindOptions = { where: { id }, include: [{ all: true }] }
    const result = await PrintTemplate.findOne(options)
    return result
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, loadModel) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
    }
    // @ts-ignore
    const result = await Paging.diyPaging(PrintTemplate, pagination, options);
    return result
  }
}
