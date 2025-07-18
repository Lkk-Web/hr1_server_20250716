import axios from 'axios'
import { CryptoUtil } from '@library/utils/crypt.util'
import { Drawing } from '@model/center/drawing.model'
import { RedisProvider } from '@library/redis'
import { info } from '@common/config'

export interface DrawingItem {
  FileExt: string
  FileTypeNo: number
  FileName: string
  FileKey: string
  MasterClassID: number
  MasterObjectID: number
  revision_no: string
  iteration_no: string
  filetype: string
  file_size: number
}
export interface TokenItem {
  AToken: string
  RToken: string
  Name: string
  StaffNO: string
  ID: number
}

/**
 * 获取第三方图纸工具
 */
export class DrawingTool {
  private static readonly url = 'http://120.226.175.176:8088/'
  private static readonly validTime = 1000 * 60 * 10

  /**
   * 查询图纸列表
   * @param name 文件名称
   * @param filetype 文件类型
   */
  public static async getDrawingList(name: string, filetype: string, token: string): Promise<Array<any>> {
    const { data } = await axios.post(
      this.url + 'api/event',
      {
        Application: 'Mkanban',
        Behavior: 'Query',
        Method: 'SearchDoc',
        SecurityContext: {
          DynamicSecurityFlag: false,
        },
        PARAMETERS: {
          module: 'CAXA MES Addon',
          target: 'doc',
          'doctype all': null,
          name: name,
          filetype: filetype,
          wants: ['name', 'filetype', 'creator', 'creationdate'],
          exactmatch: false,
        },
      },
      {
        headers: {
          Authorization: token,
        },
      }
    )
    return data
  }

  //获取图纸详情查询信息
  public static async getDrawingDetail(param: any, token: string): Promise<DrawingItem> {
    const { data } = await axios.post(
      this.url + 'api/event',
      {
        Application: 'Mkanban',
        Behavior: 'View',
        Method: 'DownloadDocumentWithoutCheck',
        SecurityContext: {
          DynamicSecurityFlag: false,
        },
        PARAMETERS: {
          Master: {
            ObjectID: param.Doc.ObjectID,
            ClassID: param.Doc.ClassID,
          },
          Param: {
            DocCache: true,
            ExbBlackPrint: false,
            CxpBlackPrint: false,
          },
          Revision: {
            ObjectID: param.Rev.ObjectID,
            ClassID: param.Rev.ClassID,
          },
          Iteration: {
            ObjectID: param.Itr.ObjectID,
            ClassID: param.Itr.ClassID,
          },
        },
      },
      {
        headers: {
          Authorization: token,
        },
      }
    )
    return data
  }

  //拼接图纸pdf url
  public static getDrawingPdfUrl(param: DrawingItem, token: string): string {
    const fileKey = param.FileKey
    const fileType = param.FileExt
    return `${this.url}api/file?filekey=${encodeURIComponent(fileKey)}&filetype=${fileType}&token=${token}`
  }

  //拼接图纸dwg url
  public static getDrawingDwgUrl(param: DrawingItem, token: string): string {
    const fileKey = param.FileKey
    const fileType = param.FileExt
    return `mkanban://${this.url.replace(':', '')}api/file?filekey=${encodeURIComponent(fileKey)}&filetype=${fileType}&token=${token}${encodeURIComponent(
      `|${param.FileName}|0|${param.FileTypeNo}`
    )}`
  }

  //完整查询获取图纸url
  public static async getDrawingUrl(name: string, filetype: string): Promise<string> {
    const key = CryptoUtil.hashing(`${name}_${filetype}`)
    const drawing = await Drawing.findOne({
      where: { key },
      attributes: ['id', 'url', 'updatedAt'],
    })
    if (drawing && drawing.updatedAt.getTime() > new Date().getTime() - this.validTime) {
      console.log('使用缓存图纸', drawing.url)
      return drawing.url
    }
    const token = await this.getToken()
    const list = await this.getDrawingList(name, filetype, token)
    if (list.length == 0) {
      return ''
    }
    //转为小写
    const data = list.find(v => v.Doc.name.toLowerCase() == name + '.' + filetype) || list[0]
    const detail = await this.getDrawingDetail(data, token)
    let url: string
    if (detail.filetype == 'pdf') {
      url = this.getDrawingPdfUrl(detail, token)
    } else {
      url = this.getDrawingDwgUrl(detail, token)
    }

    if (drawing) {
      await drawing.update({
        url,
        fileName: detail.FileName,
      })
    } else {
      await Drawing.create({
        key,
        fileName: detail.FileName,
        url,
      })
    }

    return url
  }

  //获取token
  private static async getToken() {
    const client = RedisProvider.redisClient.client
    const key = `${info.appName}:drawing_token`
    let token = await client.get(key)
    if (!token) {
      const { data } = await axios.post(this.url + 'auth/token', {
        Domain: 'MKanban',
        UsedProp: 'staffno',
        Name: 'MES',
        Pwd: 'RlBJIMVBThV0TrJQu2ZprU0kUTOTjRSxcRb2ReMVxPj1XaTeChxv3igCSSC7wl301u30FrZaZLZKmuClF5F85mRlwRQfIXmwOsRlY+RlAUBf/y4vemikIk/J964av3zy7OIEMSzUvYzN6L+LF9pVelYKF070KJrWSalA5aePOaA=',
        IsCrypto: false,
        IsCipher: true,
        DeviceId: 'chrome-1746686934867',
        IsMesCall: true,
      })
      token = data.AToken
      // 设置10分钟有效
      await client.set(key, token, 'EX', 600)
    }
    return token
  }
}
