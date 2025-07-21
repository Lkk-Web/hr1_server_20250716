import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import _ = require('lodash')
import { CFileVersionDto, EFileVersionDto, FindPaginationDto } from '../dtos/FileVersion.dto'
import { User } from '@model/auth/user'
import { FindOptions } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { FileVersion } from '@model/document/FileVersion.model'
import { FileList } from '@model/document/FileList.model'
import { Paging } from '@library/utils/paging'

@Injectable()
export class FileVersionService {
  constructor(
    @InjectModel(FileVersion)
    private FileVersionModel: typeof FileVersion
  ) {}

  public async create(dto: CFileVersionDto, user: User, loadModel) {
    // dto['createUserId'] = user.id
    let versionCode = ''
    let files = await FileList.findOne({ where: { id: dto.fileListId } }) // 获取文件列表的最新版本号
    if (files) {
      let code = files.versionCode.substring(1)
      let nweCode = parseInt(code) + 1
      versionCode = 'v' + nweCode
    }
    dto['versionCode'] = versionCode
    const result = await FileVersion.create(dto)
    // 更新文件列表的最新版本
    await FileList.update({ versionCode: versionCode, url: result.url, updateUserId: user.id }, { where: { id: dto.fileListId } })
    return result
  }

  public async edit(dto: EFileVersionDto, id: number, user: User, loadModel) {
    let fileVersion = await FileVersion.findOne({ where: { id } })
    if (!fileVersion) {
      throw new HttpException('数据不存在', 400006)
    }
    dto['updateUserId'] = user.id
    await fileVersion.update(dto)
    fileVersion = await FileVersion.findOne({ where: { id } })
    return fileVersion
  }

  public async delete(id: number, loadModel) {
    const result = await FileVersion.destroy({
      where: {
        id: id,
      },
    })
    return result
  }

  public async find(id: number, loadModel) {
    const options: FindOptions = { where: { id }, include: [{ all: true }] }
    const result = await FileVersion.findOne(options)
    return result
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, loadModel) {
    const options: FindPaginationOptions = {
      where: { fileListId: dto.fileListId },
      include: [
        {
          association: 'createdUser',
          attributes: ['id', 'userName'],
        },
        {
          association: 'updateUser',
          attributes: ['id', 'userName'],
        },
      ],
      pagination,
    }
    const result = await Paging.diyPaging(FileVersion, pagination, options)
    return result
  }
}
