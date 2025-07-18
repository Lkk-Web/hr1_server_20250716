import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import _ = require('lodash')
import { FileMenu } from '@model/dm/FileMenu.model'
import { CFileMenuDto, EFileMenuDto, FindPaginationDto } from '../dtos/FileMenu.dto'
import { FindPaginationOptions } from '@model/shared/interface'
import { FindOptions, Op } from 'sequelize'
import { STRUtil } from '@library/utils/str'
import { FileList } from '@model/dm/FileList.model'
import { Paging } from '@library/utils/paging'

@Injectable()
export class FileMenuService {
  constructor(
    @InjectModel(FileMenu)
    private FileMenuModel: typeof FileMenu
  ) { }

  public async create(dto: CFileMenuDto, loadModel) {
    let fileMenu = await FileMenu.findOne({ where: { name: dto.name } })
    if (fileMenu) {
      throw new HttpException('已存在该文件目录', 400007)
    }
    const result = await FileMenu.create(dto)
    return result
  }

  public async edit(dto: EFileMenuDto, id: number, loadModel) {
    let fileMenu = await FileMenu.findOne({ where: { id } })
    if (!fileMenu) {
      throw new HttpException('数据不存在', 400006)
    }
    let FileMenuTwo = await FileMenu.findOne({ where: { name: dto.name, id: { [Op.ne]: id } } })
    if (FileMenuTwo) {
      throw new HttpException('已存在该文件目录', 400007)
    }
    await fileMenu.update(dto)
    fileMenu = await FileMenu.findOne({ where: { id } })
    return fileMenu
  }

  public async delete(id: number, loadModel) {
    const fileLists = await FileList.findAll({ where: { fileMenuId: id } })
    if (fileLists.length > 0) {
      throw new HttpException('该目录下存在文件，请先删除后再删除该目录！', 400)
    }
    const fileTypes = await FileMenu.findAll({ where: { parentId: id } })
    if (fileTypes.length > 0) {
      throw new HttpException('该目录下存在子目录，请先删除后再删除该目录！', 400)
    }
    const result = await FileMenu.destroy({
      where: {
        id: id,
      },
    })
    return result
  }

  public async find(id: number, loadModel) {
    const options: FindOptions = { where: { id }, include: [{ all: true }] }
    const result = await FileMenu.findOne(options)
    return result
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, loadModel) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
    }
    if (dto.name) {
      options.where['name'] = {
        [Op.eq]: dto.name,
      }
    }
    if (dto.types) {
      options.where['types'] = {
        [Op.eq]: dto.types,
      }
    }
    if (dto.parentId) {
      options.where['parentId'] = {
        [Op.eq]: dto.parentId,
      }
    }
    if (dto.status) {
      const statusString = String(dto.status).toLowerCase().trim() // 确保字符串统一处理
      const statusBoolean = statusString === 'true' || statusString === '1' // 转换逻辑
      options.where['status'] = {
        [Op.eq]: statusBoolean,
      }
    }

    // @ts-ignore
    const result = await FileMenu.findAll(options)
    // @ts-ignore
    for (const fileMenu of result) {
      // @ts-ignore
      const list = await Paging.diyPaging(FileList, pagination, { where: { fileMenuId: fileMenu.id } })
      // @ts-ignore
      fileMenu.setDataValue('count', list.data.length)
    }
    let menuList = STRUtil.buildMenuTree(JSON.parse(JSON.stringify(result)))
    return menuList
  }
}
