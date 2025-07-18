import { HttpException, Injectable } from '@nestjs/common'
import { TrendsField, TrendsTemplate } from '@model/index'
import { InjectModel } from '@nestjs/sequelize'
import { Aide } from '@library/utils/aide'
import { CTrendsTemplateDto, ETrendsTemplateDto, TrendsTemplateListDto } from './trendsTemplate.dto'
import { Op } from 'sequelize'
import { Pagination } from '@common/interface'
import { FindPaginationOptions } from '@model/shared/interface'
import { Paging } from '@library/utils/paging'
import _ = require('lodash')

@Injectable()
export class TrendsTemplateService {
    constructor(
        @InjectModel(TrendsTemplate)
        private readonly localModel: typeof TrendsTemplate
    ) {
    }

    public async create(dto: CTrendsTemplateDto) {
        const temp = await TrendsTemplate.findOne({ where: { name: dto.name,code:dto.code } })
        if (temp) throw new HttpException('模版名称已存在', 400)
        const fieldDto = dto.trendsFieldDatas
        delete dto.trendsFieldDatas
        const result = await TrendsTemplate.create({ ...dto })
        await TrendsField.bulkCreate(fieldDto.map(v=>({
            ...v,
            templateId:result.id
        })))
        return result
    }

    public async findPagination(dto: TrendsTemplateListDto, pagination: Pagination, loadModel) {
        Aide.Fuzzification(dto)
        const options: FindPaginationOptions = {
            where: _.pickBy(dto, _.identity),
            pagination,
            include: [
                {
                    association: "trendsFieldDatas",
                    attributes: ['id', 'name', 'types', 'state', 'len', 'sort', 'tip', 'fieldOption', 'status'],
                    order: ['sort']
                },
            ],
        };
        const result = await Paging.diyPaging(TrendsTemplate, pagination, options);
        return result;
    }

    public async update(id: number, dto: ETrendsTemplateDto, loadModel) {
        const temp = await TrendsTemplate.findByPk(id)
        if (temp.name != dto.name) {
            const res = await TrendsTemplate.findOne({ where: { name: { [Op.eq]: dto.name },code:temp.code } })
            if (res) throw new HttpException('该动态字段模版名称已存在', 400)
        }

        const fieldDto = dto.trendsFieldDatas
        delete dto.trendsFieldDatas
        const result = await TrendsTemplate.update(dto, { where: { id } })
        await TrendsField.destroy({ where: { templateId: id } })
        await TrendsField.bulkCreate(fieldDto.map(v=>({
            ...v,
            templateId:temp.id
        })))
        return result[0] ? true : false
    }

    public async delete(id: number, loadModel) {
        const result = await this.findId(id, loadModel)
        await result.destroy()
        return result ? true : false
    }

    public async findId(id: number, loadModel) {
        if (!id) Aide.throwException(400026)
        const result = await TrendsTemplate.findOne({
            where: { id },
            include: [
                {
                    association: "trendsFieldDatas",
                    attributes: ['id', 'name', 'types', 'state', 'len', 'sort', 'tip', 'fieldOption', 'status','defaultValue','isEdit'],
                    order: ['sort']
                },
            ],
        })
        if (!result) Aide.throwException(400026)
        return result
    }

    public async find(code: string, loadModel) {
        if (!code) Aide.throwException(400026)
        const result = await TrendsTemplate.findOne({
            where: { code: code },
            include: [
                {
                    association: "trendsFieldDatas",
                    attributes: ['id', 'name', 'types', 'state', 'len', 'sort', 'tip', 'fieldOption', 'status'],
                    order: ['sort']
                },
            ],
        })
        return result
    }

    public async getListByCode(code: string) {
        if (!code) Aide.throwException(400026)
        const result = await TrendsTemplate.findAll({
            where: { code: code },
            attributes: ['id', 'name', 'code', 'describe', 'sort', 'createdAt', 'updatedAt', 'types'],
            include: [
                {
                    association: "trendsFieldDatas",
                    attributes: ['id', 'name', 'types', 'state', 'len', 'sort', 'tip', 'fieldOption', 'status','defaultValue','isEdit'],
                    order: ['sort']
                },
            ],
        })
        return result
    }

}
