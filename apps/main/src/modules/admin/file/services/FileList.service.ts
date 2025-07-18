import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import _ = require('lodash')
import { FileList } from '@model/document/FileList.model'
import { CFileListDto, EFileListDto, FindPaginationDto } from '../dtos/FileList.dto'
import { User } from '@model/sys/user.model'
import { FileVersion } from '@model/document/FileVersion.model'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { FileMenu } from '@model/document/FileMenu.model'
import { STRUtil } from '@library/utils/str'
import { Paging } from '@library/utils/paging'
import { AdjustOrder } from '@model/warehouse/adjustOrder.model'

@Injectable()
export class FileListService {
  constructor(
    @InjectModel(FileList)
    private FileListModel: typeof FileList
  ) {}

  public async create(dto: CFileListDto, user: User, loadModel) {
    const temp = await FileList.findOne({ where: { name: dto.name } })
    if (temp) throw new HttpException('已有同名文件', 400)
    let version = {
      createUserId: user.id,
      versionCode: 'v1',
      url: dto.url,
      name: dto.fileName,
      describe: dto.versionDescribe,
    }
    delete dto.versionDescribe
    delete dto.fileName
    dto['versionCode'] = 'v1'
    dto['createUserId'] = user.id
    const result = await FileList.create(dto)
    version['fileListId'] = result.id
    await FileVersion.create(version)
    return result
  }

  public async edit(dto: EFileListDto, id: number, user: User, loadModel) {
    dto['updateUserId'] = user.id
    let fileList = await FileList.findOne({ where: { id } })
    if (!fileList) {
      throw new HttpException('数据不存在', 400006)
    }
    const temp = await FileList.findOne({ where: { name: dto.name } })
    if (temp && temp.id != id) throw new HttpException('已有同名文件', 400)
    await fileList.update(dto)
    fileList = await FileList.findOne({ where: { id } })
    return fileList
  }

  public async delete(id: number, loadModel) {
    // const files = await FileVersion.findAll({ where: { fileListId: id } });
    // if (files.length > 0) {
    // 	throw new HttpException('该目录下还有文件，请先删除文件后再删除该目录！', 400);
    // }
    await FileVersion.destroy({
      where: {
        fileListId: id,
      },
    })
    const result = await FileList.destroy({
      where: {
        id: id,
      },
    })
    return result
  }

  public async find(id: number, loadModel) {
    const options: FindOptions = { where: { id }, include: [{ all: true }] }
    const result = await FileList.findOne(options)
    return result
  }

  public async findByUrl(url: string, loadModel) {
    const options: FindOptions = { where: { url: { [Op.like]: `%${url}%` } }, include: [{ all: true }] }
    const result = await FileList.findOne(options)
    return result
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, loadModel) {
    const options: FindPaginationOptions = {
      where: { fileMenuId: dto.fileMenuId },
      include: [{ all: true }],
      pagination,
    }
    if (dto.name) {
      options.where['name'] = { [Op.like]: `%${dto.name}%` }
    }

    const result = await Paging.diyPaging(FileList, pagination, options)
    // @ts-ignore
    for (const datum of result.data) {
      const obj = await FileMenu.findAll({ where: { status: 1 } })
      const name = STRUtil.findTopParentName(datum.dataValues.fileMenuId, obj)
      datum.setDataValue('catalogue', name)
    }
    return result
  }
}
