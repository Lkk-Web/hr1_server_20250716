import { Logger } from '@nestjs/common';
import { OrderItem } from 'sequelize';

export class Paging {
    /**
     * 手动分页
     * @param data 数据
     * @param pagination 分页参数
     */

    public static async diyPaging(model: any, pagination: any, options: any = {}) {
        const current = pagination && pagination.current ? Number(pagination.current) : 1;
        const order = pagination && pagination.order ? pagination.order : "id DESC";
        const pageSize = pagination && pagination.pageSize ? Number(pagination.pageSize) : 10;;

        options.limit = pageSize;
        options.offset = (current - 1) * pageSize;
        options.distinct = true;
        if (!options.order) {
            const orderArr = order.split(";")
            options.order = []
            for (let i = 0; i < orderArr.length; i++) {
                options.order.push(orderArr[i].split(" ") as OrderItem)
            }
        }

        const result = { data: [], current, pageSize, pageCount: 0, total: 0 };
        const dataList = await model.findAndCountAll(options);

        if (model) {
            result.data = dataList.rows;
            result.total = dataList.count;
            result.pageCount = Math.floor((dataList.count - 1) / pageSize) + 1;
        }
        return result;
    }
}