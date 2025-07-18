import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import { CApiDictDto, FindPaginationDto, GetByK3Dto, UApiDictDto } from './apiDict.dto'
import { Sequelize } from 'sequelize-typescript'
import { FindOptions } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { Paging } from '@library/utils/paging'
import { ApiDict } from '@model/index'
import { KingdeeeService } from '@library/kingdee'
import { K3DictMapping } from '@library/kingdee/kingdee.keys.config'

@Injectable()
export class ApiDictService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: Redis,

    @InjectModel(ApiDict)
    private apiDictModel: typeof ApiDict,
    private sequelize: Sequelize
  ) { }

  public async create(dto: CApiDictDto) {
    const result = await ApiDict.create(dto)
    return result
  }

  public async edit(dto: UApiDictDto, id: number) {
    let apiDict = await ApiDict.findOne({ where: { id } })
    if (!apiDict) {
      throw new HttpException('数据不存在', 400006)
    }
    await apiDict.update(dto)
    apiDict = await ApiDict.findOne({ where: { id } })
    return apiDict
  }

  public async delete(id: number) {
    const result = await ApiDict.destroy({
      where: {
        id: id,
      },
    })
    return result
  }

  public async find(id: number) {
    const options: FindOptions = { where: { id }, include: [{ all: true }] }
    const result = await ApiDict.findOne(options)
    return result
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
    }
    // @ts-ignore
    const result = await Paging.diyPaging(ApiDict, pagination, options);
    return result
  }

  public async getKingdee(dto: GetByK3Dto) {
    let data = await KingdeeeService.getExeList(dto.FormId, dto.FieldKeys)
    let mate = await KingdeeeService.parseKingdeeFormData("fid,code,content,content1,content2", data, { xtName: dto.xtName, name: dto.name })
    await ApiDict.bulkCreate(mate, { updateOnDuplicate: ['xtName', 'name', 'fid', 'code', 'content', 'content1', 'content2'] })
    return data
    //
  }

  public async syncDict() {
    // 更新时间参数
    // let updateData = await RedisProvider.redisClient.client.get(RedisKey.K3_UPDATE_DATE.BD_MATERIAL)
    // let filterString = updateData ? `FModifyDate>='${updateData}'` : ''
    // 使用环境变量中的K3_ORG_ID作为过滤条件
    let filterString = `FUseOrgId='${process.env.K3_ORG_ID}'`
    // 初始化统计计数器
    let tjCount = 0
    // 获取字典映射列表
    let dictList = K3DictMapping
    // 遍历字典映射列表
    for (let dict of dictList) {
      // 翻页参数
      const pageSize = 1000 // 每页数据量
      let startRow = 0 // 起始行数
      while (true) {
        try {
          // 读取金蝶接口方式
          console.log('pageSize: ', pageSize, startRow)
          let fieldKeys = dict.keys.map(v => v[1]).join(',')
          let data = await KingdeeeService.getListV2(dict.formID, fieldKeys, dict.filterString ? dict.filterString : '', pageSize, startRow)

          if (data.length == 0) {
            console.log('所有数据已查询完毕。')
            break
          }
          data = KingdeeeService.parseKingdeeDict(data, dict.keys, dict.name)
          await ApiDict.destroy({ where: { name: dict.name } })
          // 更新或插入数据库
          let result = await ApiDict.bulkCreate(data, { updateOnDuplicate: ['code'] })
          // 翻页
          startRow += data.length
          if (data.length < pageSize) {
            console.log('所有数据已查询完毕。')
            break
          }
          // console.log('result: ', result)

        } catch (error) {
          console.error('请求发生错误:', error)
          break
        }
      }
      tjCount += startRow
    }
    return { count: tjCount }
  }
}
