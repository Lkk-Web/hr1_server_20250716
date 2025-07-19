import { OpenAuthorize } from '@core/decorator/metaData'
import { AdminAuth } from '@core/decorator/controller'
import { Body, Get, HttpCode, HttpException, HttpStatus, Param, Post, Query, Req, Res, StreamableFile, UploadedFile, UseInterceptors } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { changeFactoryDto, OrderProgressDto, RoleBoardDto, taskProgressDto } from './mi.dto'
import { MiService } from './mi.service'
import { FileInterceptor } from '@nestjs/platform-express'
import { Aide } from '@library/utils/aide'
import { FileUploadDto } from '../../file/file.dto'
import { SyncKingdeeDto } from '@common/dto'
import { KingdeeeService } from '@library/kingdee'
import { RedisProvider } from '@library/redis'
import { ApiDict } from '@model/index'
import dayjs = require('dayjs')
import { K3Mapping } from '@library/kingdee/kingdee.keys.config'
import { FileService } from '@modules/file/file.service'

@ApiTags('我的')
@ApiBearerAuth()
@AdminAuth('mi')
export class MiController {
  constructor(private readonly service: MiService, private readonly fileService: FileService) {}

  @ApiOperation({ summary: 'PC首页' })
  @HttpCode(HttpStatus.OK)
  @Get('PCHome/:type')
  @ApiParam({ name: 'type', required: true, description: 'type', type: String })
  async PCHome(@Param() Param, @Req() req) {
    let { factoryCode, loadModel } = req
    return this.service.PCHome(Param.type, req.user, loadModel)
  }

  @ApiOperation({ summary: '切换工厂' })
  @HttpCode(HttpStatus.OK)
  @Post('changeFactory')
  async changeFactory(@Body() dto: changeFactoryDto, @Req() req) {
    let { factoryCode, loadModel } = req
    return this.service.changeFactory(dto, req.user, loadModel)
  }

  @ApiOperation({ summary: '角色看板' })
  @HttpCode(HttpStatus.OK)
  @Get('roleBoard')
  async roleBoard(@Query() dto: RoleBoardDto, @Req() req) {
    return this.service.roleBoard(dto, req.user)
  }

  @ApiOperation({ summary: '车间看板' })
  @HttpCode(HttpStatus.OK)
  @Get('workShopBoard')
  async workShopBoard(@Query() dto: RoleBoardDto, @Req() req) {
    let { factoryCode, loadModel } = req
    return this.service.workShopBoard(dto, req.user, loadModel)
  }

  @ApiOperation({ summary: '生产实时播报' })
  @HttpCode(HttpStatus.OK)
  @Get('productionBroadcast')
  async productionBroadcast(@Query() dto: RoleBoardDto, @Req() req) {
    let { factoryCode, loadModel } = req
    return this.service.productionBroadcast(dto, req.user, loadModel)
  }

  @ApiOperation({ summary: '设备动态播报' })
  @HttpCode(HttpStatus.OK)
  @Get('equipmentBroadcast')
  async equipmentBroadcast(@Query() dto: RoleBoardDto, @Req() req) {
    let { factoryCode, loadModel } = req
    return this.service.equipmentBroadcast(dto, req.user, loadModel)
  }

  @ApiOperation({ summary: '工单进度' })
  @HttpCode(HttpStatus.OK)
  @Get('orderProgress')
  async orderProgress(@Req() req, @Query() dto: OrderProgressDto) {
    let { factoryCode, loadModel } = req
    return this.service.orderProgress(req.user, dto, loadModel)
  }

  @ApiOperation({ summary: '部门工序进度' })
  @HttpCode(HttpStatus.OK)
  @Get('deptProgress')
  async deptProgress(@Req() req, @Query() dto: taskProgressDto) {
    let { factoryCode, loadModel } = req
    return this.service.deptProgress(req.user, dto, loadModel)
  }

  @ApiOperation({ summary: '任务执行进度' })
  @HttpCode(HttpStatus.OK)
  @Get('questionProcess')
  async questionProcess(@Req() req, @Query() dto: taskProgressDto) {
    let { factoryCode, loadModel } = req
    return this.service.questionProcess(req.user, dto, loadModel)
  }

  @ApiOperation({ summary: '绩效排名' })
  @HttpCode(HttpStatus.OK)
  @Get('salary')
  async salary(@Req() req, @Query() dto: OrderProgressDto) {
    let { factoryCode, loadModel } = req
    return this.service.salary(req.user, dto, loadModel)
  }

  @ApiOperation({ summary: '文件上传' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fieldSize: 55555 } }))
  @ApiBody({ description: '文件上传', type: FileUploadDto })
  @HttpCode(HttpStatus.OK)
  @Post('upload')
  async upload(@UploadedFile() file, @Req() req) {
    if (!file) throw new HttpException(null, 400014)
    const result = await this.fileService.uploadFile(file)
    return result
  }

  @ApiOperation({ summary: '同步金蝶公用接口' })
  @OpenAuthorize()
  @Post('syncKingdee')
  async syncKingdee(@Body() dto: SyncKingdeeDto): Promise<any> {
    const { formID, dbModel, keys, redisKey, detailTypes, detailKeys, dbModelDetail, dict, filterString, pageSize: size } = K3Mapping[dto.tableName]
    // 更新时间参数
    let updateData = await RedisProvider.redisClient.client.get(redisKey)
    // let filterString = updateData ? `FModifyDate>='${updateData}'` : ''
    // filterString += ` and FUseOrgId='${process.env.K3_ORG_ID}'`
    // console.log('filterString: ', filterString)
    // 翻页参数
    const pageSize = size || 10000
    let startRow = 0
    // 明细翻页
    const pageSizeDetail = size || 10000
    let startRowDetail = 0
    let dictKey = []
    let dictFieldKey = []
    let dictDataList = []
    if (dict) {
      for (let zd of dict) {
        let dataList = []
        let dictAll = await ApiDict.findAll({
          where: { name: zd.name, xtName: '金蝶' },
          attributes: [zd.keyName, zd.valueName],
        })
        dictAll.map(v => {
          dataList.push([v[zd.keyName], v[zd.valueName]])
        })
        dictKey.push(zd.key)
        dictFieldKey.push(zd.fieldName)
        dictDataList.push(dataList)
      }
    }
    while (true) {
      try {
        // 读取金蝶接口方式
        console.log('pageSize: ', pageSize, startRow)
        let fieldKeys = keys.map(v => v[1]).join(',')
        if (dict) {
          fieldKeys += ',' + dictKey.join(',')
        }
        let data = await KingdeeeService.getListV2(formID, fieldKeys, filterString ? filterString : `FUseOrgId='${process.env.K3_ORG_ID}'`, pageSize, startRow)
        if (data.length == 0) {
          console.log('所有数据已查询完毕。')
          break
        }
        data = KingdeeeService.parseKingdeeDataByMapping(data, keys, dictKey, dictFieldKey, dictDataList)
        // 更新或插入数据库
        let bdKeys = keys.map(v => v[2])
        if (dict) {
          bdKeys.push(...dictFieldKey)
        }
        let result = await dbModel.bulkCreate(data, { updateOnDuplicate: bdKeys })
        // 翻页
        startRow += data.length
        if (data.length < pageSize) {
          console.log('所有数据已查询完毕。')
          break
        }
      } catch (error) {
        console.error('请求发生错误:', error)
        Aide.throwException(500, error)
        break
      }
    }
    if (detailTypes) {
      while (true) {
        try {
          // 读取金蝶接口方式
          console.log('pageSizeDetail: ', pageSizeDetail, startRowDetail)
          let data = await KingdeeeService.getListV2(
            formID,
            detailKeys.map(v => v[1]).join(','),
            filterString ? filterString : `FUseOrgId='${process.env.K3_ORG_ID}'`,
            pageSizeDetail,
            startRowDetail
          )
          if (data.length == 0) {
            console.log('所有数据已查询完毕。')
            break
          }
          data = KingdeeeService.parseKingdeeDataByMapping(data, detailKeys, dictKey, dictFieldKey, dictDataList)
          // 更新或插入数据库
          let result = await dbModelDetail.bulkCreate(data, { updateOnDuplicate: detailKeys.map(v => v[2]) })
          // 翻页
          startRowDetail += data.length
          if (data.length < pageSize) {
            console.log('所有数据已查询完毕。')
            break
          }
        } catch (error) {
          console.error('请求发生错误:', error)
          Aide.throwException(500, error)
          break
        }
      }
    }
    await RedisProvider.redisClient.client.set(redisKey, dayjs().format('YYYY-MM-DD'))
    return { updateData, count: startRow, detail: startRowDetail }
  }

  @ApiOperation({ summary: '获取临时文件' })
  @HttpCode(HttpStatus.OK)
  @OpenAuthorize()
  @ApiParam({ name: 'md5', description: '文件md5', required: true, type: String })
  @Get('file/:md5')
  async getFile(@Res({ passthrough: true }) res, @Param('md5') md5: string) {
    const info = Aide.getBuffer(md5)
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${encodeURI(info.name)}"`,
    })
    return new StreamableFile(info.buffer)
  }
}
