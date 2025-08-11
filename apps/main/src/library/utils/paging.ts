import { Logger } from '@nestjs/common'
import { OrderItem } from 'sequelize'

export class Paging {
  /**
   * 手动分页
   * @param data 数据
   * @param pagination 分页参数
   */

  public static async diyPaging(model: any, pagination: any, options: any = {}) {
    const current = pagination && pagination.current ? Number(pagination.current) : 1
    const order = pagination && pagination.order ? pagination.order : 'id DESC'
    const pageSize = pagination && pagination.pageSize ? Number(pagination.pageSize) : 10

    options.limit = pageSize
    options.offset = (current - 1) * pageSize
    options.distinct = true
    if (!options.order) {
      const orderArr = order.split(';')
      options.order = []
      for (let i = 0; i < orderArr.length; i++) {
        options.order.push(orderArr[i].split(' ') as OrderItem)
      }
    }

    const result = { data: [], current, pageSize, pageCount: 0, total: 0 }

    // 为了解决复杂关联查询中 count 不准确的问题，分别执行 count 和 findAll
    // 创建专门用于 count 的选项，移除可能影响计数准确性的参数
    const countOptions = { ...options }
    delete countOptions.limit
    delete countOptions.offset
    delete countOptions.order
    delete countOptions.attributes

    // 简化 include 中的 attributes，只保留必要的关联条件
    if (countOptions.include) {
      countOptions.include = this.simplifyIncludeForCount(countOptions.include)
    }

    // 分别执行 count 和 findAll 查询
    const [total, rows] = await Promise.all([model.count(countOptions), model.findAll(options)])

    if (model) {
      result.data = rows
      result.total = total
      result.pageCount = Math.floor((total - 1) / pageSize) + 1
    }
    return result
  }

  /**
   * 简化 include 配置用于 count 查询
   * 移除 attributes 和不必要的嵌套 include，保留 where 条件
   */
  private static simplifyIncludeForCount(include: any[]): any[] {
    return include.map(item => {
      const simplified: any = {
        association: item.association,
        required: item.required !== false, // 默认为 true，除非明确设置为 false
      }

      // 保留 where 条件，因为它们影响计数
      if (item.where) {
        simplified.where = item.where
      }

      // 递归处理嵌套的 include
      if (item.include && item.include.length > 0) {
        simplified.include = this.simplifyIncludeForCount(item.include)
      }

      return simplified
    })
  }
}
