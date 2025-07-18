import { Injectable } from '@nestjs/common'
import { TrendsField, User, } from "@model/index";
import { InjectModel } from "@nestjs/sequelize";
import { Aide } from "@library/utils/aide";
import { CTrendsFieldDto, TrendsFieldListDto, ETrendsFieldDto } from './trendsField.dto'
import { Sequelize } from "sequelize";
import { Pagination } from '@common/interface'
import { FindPaginationOptions } from "@model/shared/interface";
import * as dayjs from "dayjs";
import _ = require('lodash');
import { Paging } from '@library/utils/paging'

@Injectable()
export class TrendsFieldService {
    constructor(
        @InjectModel(TrendsField)
        private readonly localModel: typeof TrendsField
    ) {
    }

    public async create(dto: CTrendsFieldDto, user: User, ip: string, loadModel) {
        const result = await TrendsField.create({ ...dto })
        return result
    }

    public async findPagination(dto: TrendsFieldListDto, pagination: Pagination, loadModel) {
        Aide.Fuzzification(dto)
        const options: FindPaginationOptions = {
            where: _.pickBy(dto, _.identity),
            pagination
        };

        const result = await Paging.diyPaging(TrendsField, pagination, options);
        return result;
    }

    public async update(id: number, dto: ETrendsFieldDto, user: User, ip: string, loadModel) {
        const result = await TrendsField.update(dto, { where: { id } })
        return result[0] ? true : false
    }

    public async delete(id: number, user: User, ip: string, loadModel) {
        const result = await this.find(id, loadModel)
        await result.destroy()
        return result ? true : false
    }

    public async find(id: number, loadModel) {
        if (!id) Aide.throwException(400026)

        const result = await TrendsField.findByPk(id)
        if (!result) Aide.throwException(400026)

        return result
    }

}
