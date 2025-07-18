import * as JSZip from 'jszip'
import * as fs from 'fs'
import axios from 'axios'
import { Column } from 'exceljs'
import { join } from 'path'
import * as FormData from 'form-data'
import { HttpException } from '@nestjs/common'
import { nanoid } from 'nanoid'
import * as configs from '@common/config'
import { COS_CONFIG, info, MINIO_CONFIG, ReMailboxInfo } from '@common/config'
import { Op } from 'sequelize'
import { FileBuffer } from '@common/cache'
import { BufferCacheInfo, Pagination } from '@common/interface'
import * as COS from 'cos-nodejs-sdk-v5'
import { TimeDto } from '@common/dto'
import { OpUnitType } from 'dayjs'
import Excel = require('exceljs')
import dayjs = require('dayjs')
import url = require('url')
import _ = require('lodash')
import Minio = require('minio')

const crypto = require('crypto')

export class Aide {
  private static cacheFilePath = join(__dirname, '../../cache.json')
  private static minio: Minio.Client = null

  public static getMinio() {
    if (!this.minio) {
      this.minio = new Minio.Client(MINIO_CONFIG)
    }
    return this.minio
  }

  //上传到minio
  public static async uploadFileMinio(file: Express.Multer.File) {
    const minio = this.getMinio()
    const fileName = Buffer.from(file.originalname, 'latin1').toString('utf8')
    const suffix = fileName.substring(fileName.lastIndexOf('.'))
    const time = Date.now()
    const filePath = `${info.appName}/upload/${time.toString() + _.random(1000, 9999) + suffix}`
    const result = await new Promise((resolve, reject) => {
      minio.putObject(MINIO_CONFIG.bucket, filePath, file.buffer, file.buffer.length, (err, obj) => {
        if (err) {
          reject(err)
        } else {
          resolve(obj)
        }
      })
    })
    return `${MINIO_CONFIG.url}/${filePath}`
    // return result
  }

  static async uploadFile(file: Express.Multer.File) {
    const cos = new COS({
      SecretId: COS_CONFIG.SecretId,
      SecretKey: COS_CONFIG.SecretKey, // 密钥key
    })
    const fileName = Buffer.from(file.originalname, 'latin1').toString('utf8')
    const suffix = fileName.substring(fileName.lastIndexOf('.'))
    const time = Date.now()
    const putObjectResult = await new Promise((resolve, reject) => {
      cos.putObject(
        {
          Bucket: COS_CONFIG.Bucket,
          Region: COS_CONFIG.Region,
          Key: `${info.appName}/upload/${time.toString() + _.random(1000, 9999) + suffix}`,
          Body: file.buffer,
        },
        function (err, data) {
          if (err) {
            reject(err)
            return
          }
          resolve(data)
        }
      )
    })
    let result = `https://${putObjectResult['Location']}`
    if (COS_CONFIG.domain) {
      result = result.replace(/[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+\.?/, COS_CONFIG.domain)
    }
    return decodeURI(result)
  }

  static bufferUpOSS = async (buf: ArrayBuffer | string, fileName?: string) => {
    if (!fileName) {
      fileName = `pr${nanoid(22)}.png`
    }
    let formData = new FormData()
    // formData.append("key", fileName);
    formData.append('file', buf, fileName.search('%') == -1 ? encodeURI(fileName) : fileName)
    let headers = formData.getHeaders() //获取headers
    //获取form-data长度
    formData.getLength(async function (err, length) {
      if (err) {
        return
      }
      //设置长度，important!!!
      headers['content-length'] = length
      // TODO 端口为配置好
    })

    const res = await axios({
      method: 'post',
      url: `http://127.0.0.1:${configs.info.port}/file/upload`,
      data: formData,
      headers,
      maxBodyLength: Infinity,
    })

    return decodeURI(res.data.url)
  }

  /**
   * 打包文件
   * @param fileName 包名称
   * @param filePath 文件路径
   */
  public static async packageFile(fileName: string, filePath: string[]): Promise<any> {
    fileName += '.zip'
    const zip = new JSZip()

    const aa = ['http:', 'https:']

    for (const v of filePath) {
      let name = v.split('/')
      if (name.length == 1) name = v.split('\\')

      let p = url.parse(v).path.replace('/xy1', '')
      //GBK解码
      // p = unescape(path.join(__dirname,'../../../public',p))

      let file
      try {
        // file = fs.readFileSync(p);
        const { data } = await axios.get(encodeURI(v), { timeout: 1500, responseType: 'arraybuffer' })
        file = Buffer.from(data, 'binary')
      } catch (e) {
        console.log(e.data || e)
        continue
      }

      zip.file(name[name.length - 1], file)
    }

    let buffer: any = await zip.generateAsync({
      // 压缩类型选择nodebuffer，在回调函数中会返回zip压缩包的Buffer的值，再利用fs保存至本地
      type: 'nodebuffer',
      // 压缩算法
      compression: 'DEFLATE',
      compressionOptions: {
        level: 9,
      },
    })
    //写入磁盘
    let buf = Buffer.from(buffer, 'binary')
    let filePath1 = await this.bufferUpOSS(buf, fileName)
    return filePath1
  }

  /** 导出多个工作表栏 */
  static async exportSheets(filename: string, datas: any[], isBuff: boolean = false) {
    const workbook = new Excel.Workbook()
    workbook.creator = 'orbital'
    workbook.lastModifiedBy = 'orbital'
    workbook.created = new Date()
    workbook.modified = new Date()

    for (const data of datas) {
      let sheet = workbook.addWorksheet(data.sheetName)
      sheet.columns = data.columns
      sheet.addRows(data.rows)
      sheet.getRow(1).font = {
        bold: true,
      }
      sheet.eachRow((row, rowNumber) => {
        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          }
        })
      })
    }
    const fileName = filename + '.xlsx'
    //写入缓冲区
    let buffer: any = await workbook.xlsx.writeBuffer()
    let buf = Buffer.from(buffer, 'binary')
    if (isBuff) {
      return {
        fileName,
        buffer: buf,
      }
    }
    let filePath = await this.bufferUpOSS(buf, fileName)
    // const filePath = path.resolve(publicTmpPath, fileName);
    // await workbook.xlsx.writeFile(filePath);
    return { filePath, fileName }
  }

  /**
       * JSON转Excel
       * @param columns
       * @param rows
       * @param sheetName
       * @param isBuff
       *
       * @example
       * 使用buff示例: 直接返回文件不使用链接 请求方法为get
       * res.set({
                              'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                              'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
                          })
       return new StreamableFile(buffer as any)
       */
  public static async jsonToExcel(columns: Array<Partial<Column>>, rows: any[], sheetName = dayjs().format('YYYY-MM-DD 资料'), isBuff: boolean = false) {
    const workbook = new Excel.Workbook()
    workbook.creator = 'nestjs'
    workbook.lastModifiedBy = 'nestjs'
    workbook.created = new Date()
    workbook.modified = new Date()
    let sheet = workbook.addWorksheet(sheetName)
    sheet.columns = columns
    sheet.addRows(rows)
    sheet.getRow(1).font = {
      bold: true,
      name: '微软雅黑',
    }
    const fileName = sheetName + '.xlsx'

    //写入缓冲区
    let buffer: any = await workbook.xlsx.writeBuffer()
    let buf = Buffer.from(buffer, 'binary')
    if (isBuff) {
      return {
        fileName,
        buffer: buf,
      }
    }
    let filePath = await this.bufferUpOSS(buf, fileName)
    // const filePath = path.resolve(publicTmpPath, fileName);
    // await workbook.xlsx.writeFile(filePath);
    return { filePath, fileName }
  }

  // Excel转JSON
  public static async excelToJson(buffer: Buffer, jsExclKeys: JsExclKey[]) {
    const result: CellL = { row: [], col: [] }
    const workbook = new Excel.Workbook()
    const file = await workbook.xlsx.load(buffer)
    const worksheet = await file.getWorksheet(1) //默认获取一个表

    const newJsExclKeys: JsExclKey[] = []
    //初始化
    for (let i = 0; i < jsExclKeys.length; i++) {
      let jsExclKey = newJsExclKeys.find(v => v.keyName == jsExclKeys[i].keyName || v.key == jsExclKeys[i].key)
      //跳过重复键名
      if (jsExclKey) continue
      newJsExclKeys.push({
        keyName: jsExclKeys[i].keyName,
        key: jsExclKeys[i].key,
        index: -1,
      })
    }
    worksheet.eachRow((row: any, ie) => {
      if (ie != 1) {
        const obj = {}
        for (let i = 0; i < row.values.length; i++) {
          let jsExclKey = newJsExclKeys.find(val => val.index == i)

          if (jsExclKey && jsExclKey.index == i) {
            let value = row.values[i + 1] || row.values[i + 1] == 0 ? row.values[i + 1] : null
            //过滤可能为对象
            if (value != null && typeof value == 'object') {
              if (value['richText']) {
                let str = ''
                value['richText'].forEach(valuee => {
                  str += valuee.text
                })
                value = str
              } else if (value['text']) {
                // 邮箱转链接
                value = value['text']
              } else if (value['hyperlink']) {
                value = null
              } else if (value['result']) {
                value = value['result']
              }
            }
            //排除：/ \
            if (value && (value == '/' || value == '\\')) value = null
            obj[jsExclKey.key] = value
            let col: Col = result.col.find(va => va.key == jsExclKey.key)
            if (!col) {
              result.col.push({
                key: jsExclKey.key,
                values: [value],
              })
            } else {
              //添加列内容
              col.values.push(value)
            }
          }
        }
        //添加行内容
        result.row.push(obj)
        // result.push(obj)
      } else {
        //第一行为主键,检测主键
        for (let i = 0; i < row.values.length; i++) {
          let jsExclKey = newJsExclKeys.find(v => v.keyName == row.values[i + 1])
          if (jsExclKey) {
            jsExclKey.index = i
          }
        }
      }
    })
    return result
  }

  // Excel转JSON
  public static async excelToJson1(worksheet: any, jsExclKeys: JsExclKey[]) {
    const result: CellL = { row: [], col: [] }

    const newJsExclKeys: JsExclKey[] = []
    //初始化
    for (let i = 0; i < jsExclKeys.length; i++) {
      let jsExclKey = newJsExclKeys.find(v => v.keyName == jsExclKeys[i].keyName || v.key == jsExclKeys[i].key)
      //跳过重复键名
      if (jsExclKey) continue
      newJsExclKeys.push({
        keyName: jsExclKeys[i].keyName,
        key: jsExclKeys[i].key,
        index: -1,
      })
    }
    worksheet.eachRow((row, ie) => {
      if (ie != 1) {
        const obj = {}
        for (let i = 0; i < row.values.length; i++) {
          let jsExclKey = newJsExclKeys.find(val => val.index == i)

          if (jsExclKey && jsExclKey.index == i) {
            let value = row.values[i + 1] || row.values[i + 1] == 0 ? row.values[i + 1] : null
            //过滤可能为对象
            if (value != null && typeof value == 'object') {
              if (value['richText']) {
                let str = ''
                value['richText'].forEach(valuee => {
                  str += valuee.text
                })
                value = str
              } else if (value['text']) {
                // 邮箱转链接
                value = value['text']
              } else if (value['hyperlink']) {
                value = null
              } else if (value['result']) {
                value = value['result']
              }
            }
            //排除：/ \
            if (value && (value == '/' || value == '\\')) value = null
            obj[jsExclKey.key] = value
            let col: Col = result.col.find(va => va.key == jsExclKey.key)
            if (!col) {
              result.col.push({
                key: jsExclKey.key,
                values: [value],
              })
            } else {
              //添加列内容
              col.values.push(value)
            }
          }
        }
        //添加行内容
        result.row.push(obj)
        // result.push(obj)
      } else {
        //第一行为主键,检测主键
        for (let i = 0; i < row.values.length; i++) {
          let jsExclKey = newJsExclKeys.find(v => v.keyName == row.values[i + 1])
          if (jsExclKey) {
            jsExclKey.index = i
          }
        }
      }
    })
    return result
  }
  // 读取多表格xls,返回[{name,data}...]（默认第一行为键值）
  public static async excelToJson2(buffer: Buffer) {
    const workbook = new Excel.Workbook()
    const result = []
    const xls = await workbook.xlsx.load(buffer)
    for (let index = 0; index < xls.worksheets.length; index++) {
      const worksheet = xls.worksheets[index]
      let keys = worksheet.getRow(1).values
      let values = worksheet.getRows(2, worksheet.rowCount - 1).map(v => v.values)
      let data = values.map((row: any) => {
        let vo = {}
        row.forEach((v, i) => {
          let key = _.trim(keys[i])
          if (key) {
            vo[key] = _.trim(v)
          }
        })
        return vo
      })
      result.push({
        name: worksheet.name,
        data,
      })
    }
    return result
  }

  //双标题Excel转JSON
  public static async excelToJsonSmooth(buffer: Buffer) {
    const workbook = new Excel.Workbook()
    await workbook.xlsx.load(buffer)
    const worksheet = workbook.getWorksheet(1)

    // 处理合并单元格和表头
    const mainHeaders: Array<{ title: string; startCol: number; endCol: number }> = []

    // 解析主标题（第一行）并处理合并单元格
    // 我们需要先扫描第一行识别所有的合并单元格
    const firstRowCells: Array<{ cell: Excel.Cell; colNumber: number }> = []
    worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
      firstRowCells.push({ cell, colNumber })
    })

    // 查找合并单元格并创建主标题
    for (let i = 0; i < firstRowCells.length; i++) {
      const { cell, colNumber } = firstRowCells[i]
      const title = cell.text.trim()

      // 跳过已经处理过的列
      if (mainHeaders.some(h => colNumber >= h.startCol && colNumber <= h.endCol)) {
        continue
      }

      // 检查是否是合并单元格的主单元格
      if (cell.isMerged && cell.master === cell) {
        // 找到这个合并单元格的范围
        let endCol = colNumber
        for (let j = i + 1; j < firstRowCells.length; j++) {
          const nextCell = firstRowCells[j].cell
          const nextColNumber = firstRowCells[j].colNumber

          if (nextCell.master === cell) {
            endCol = nextColNumber
          } else {
            break
          }
        }

        mainHeaders.push({
          title,
          startCol: colNumber,
          endCol,
        })
      } else if (!cell.isMerged) {
        // 非合并单元格
        mainHeaders.push({
          title,
          startCol: colNumber,
          endCol: colNumber,
        })
      }
    }

    // 解析子标题（第二行）
    const subHeaders: string[] = []
    worksheet.getRow(2).eachCell({ includeEmpty: true }, (cell, colNumber) => {
      subHeaders[colNumber - 1] = cell.text.trim()
    })

    // 构建字段映射表
    const fieldMap: { [mainTitle: string]: { [subTitle: string]: number } } = {}
    mainHeaders.forEach(({ title, startCol, endCol }) => {
      fieldMap[title] = {}
      for (let col = startCol; col <= endCol; col++) {
        const subTitle = subHeaders[col - 1]
        if (subTitle) fieldMap[title][subTitle] = col
      }
    })

    // 处理数据行
    const jsonData: JsonResult[] = []
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 2) return

      const rowData: JsonResult = {}

      // 独立字段（无子标题）
      mainHeaders
        .filter(h => h.startCol === h.endCol)
        .forEach(({ title, startCol }) => {
          const cell = row.getCell(startCol)

          rowData[title] = this.parseValue(cell)
        })

      // 嵌套字段
      Object.entries(fieldMap).forEach(([mainTitle, subMap]) => {
        const keys = Object.keys(subMap)
        if (keys.length === 0 || (keys.length == 1 && keys[0] == mainTitle)) return
        const nestedObj: { [key: string]: any } = {}
        Object.entries(subMap).forEach(([subTitle, col]) => {
          const cell = row.getCell(col)
          nestedObj[subTitle] = this.parseValue(cell)
        })

        rowData[mainTitle] = nestedObj
      })
      jsonData.push(rowData)
    })

    return jsonData
  }

  // 值类型转换
  private static parseValue(cell: Excel.Cell): string | number | null {
    const value = cell.text.trim()
    if (!value) return null
    return isNaN(value as any) ? value : value
  }

  // 对数组对象的key值进行替换，keys传入[['oldKey','newKey']...]
  public static replaceArrayKey(array: any[], keys: [string, string][]): any[] {
    const keyMap = new Map(keys)
    const newKeys = keys.map(([, newKey]) => newKey)

    return array.map(item => {
      const newItem: Record<string, any> = {}

      for (const [oldKey, newKey] of keyMap.entries()) {
        if (oldKey in item) {
          newItem[newKey] = item[oldKey]
        }
      }

      // Ensure only new keys are present
      return newKeys.reduce((acc, key) => {
        if (key in newItem) {
          acc[key] = newItem[key]
        }
        return acc
      }, {} as Record<string, any>)
    })
  }

  // 动态字段模版导入解析
  public static async excelAddFormData(formData: string, newData: string) {
    let endFormData = []
    const formDataList = JSON.parse(formData)
    if (newData) {
      const newDataList = newData?.split('；')
      for (let j = 0; j < newDataList.length; j++) {
        let valueData = newDataList[j]
        let valueList = valueData?.split('：')
        for (let i = 0; i < formDataList.length; i++) {
          let row = formDataList[i]
          // 字段类型（1单行文本，2多行文本，3单选，4多选，5日期，6图片，7文件）
          if (row.types == '4') {
            if (row.name == valueList[0]) {
              let value = valueList[1]?.split('，')
              row['value'] = value
              endFormData.push(row)
            }
          } else if (row.types == '6' || row.types == '7') {
            if (row.name == valueList[0]) {
              let urlList = valueList[1]?.split('，')
              let value = []
              for (let n = 0; n < urlList.length; n++) {
                let fileName = urlList[n]?.split('/')
                let file = {
                  name: fileName[fileName.length - 1],
                  uid: n + 1,
                  url: urlList[n],
                }
                value.push(file)
              }
              row['value'] = value
              endFormData.push(row)
            }
          } else {
            if (row.name == valueList[0]) {
              row['value'] = valueList[1]
              endFormData.push(row)
            }
          }
        }
      }
      return JSON.stringify(endFormData)
    } else {
      return ''
    }
  }
  //字段模糊搜索化
  public static Fuzzification(obj: any, filterKey?: string[]) {
    const attributes = Object.keys(obj)
    // const where = {}
    for (let i in attributes) {
      let value = obj[attributes[i]]
      let key = attributes[i]

      if (typeof value == 'object' || typeof value == 'number' || key.search(/(ID)$/i) != -1 || (filterKey && filterKey.includes(key))) {
        // obj[key] = value
        continue
      } else {
        obj[key] = {
          [Op.like]: `%${value.trim()}%`,
        }
      }
    }
    return obj
  }

  //部分字段聚合搜索
  public static polymerization(dto: any, config: PolymerizationConfig) {
    if (!dto[config.publicKey]) return
    const or: any[] = []

    for (let i = 0; i < config.key.length; i++) {
      or.push({
        [config.key[i]]: {
          [Op.like]: `%${dto[config.publicKey]}%`,
        },
      })
    }
    dto[Op.or] = or
    delete dto[config.publicKey]
    return dto
    /*dto[Op.or] = [
                {
                    title:{
                        [Op.like]:`%${dto.title}%`
                    }
                },
                {
                    content:{
                        [Op.like]:`%${dto.title}%`
                    }
                }
            ]*/
  }

  /**
   * 获取html内的字符串
   * @param data
   */
  public static getHTMLString(data: any[]) {
    let str = ''
    if (data.length == 1 && typeof data[0] == 'string') {
      return data[0]
    }
    for (let i = 0; i < data.length; i++) {
      if (!data[i].content) continue
      if (typeof data[i].content[0] == 'object') {
        str += this.getHTMLString(data[i].content)
      } else {
        str += data[i].content[0]
      }
    }
    return str.replace(/&nbsp;/g, '')
  }

  /**
   * 字符串转JSON
   * @param value 需要转换的值
   */
  public static parse(value: string) {
    try {
      return JSON.parse(value)
    } catch (e) {
      return value
    }
  }

  //从缓存文件中获取数据
  public static getCacheData(key?: string | number) {
    try {
      const data = JSON.parse(fs.readFileSync(this.cacheFilePath, { encoding: 'utf8' }))
      if (key) {
        let result = data[key]
        if (result) {
          //判断是否过期 0为永久
          if (result.aging == 0) {
            return result.data
          } else if (result.aging && result.createAt >= Date.now() - result.aging * 60 * 1000) {
            return result.data
          } else if (result.validityPeriod && result.validityPeriod > result.createAt) {
            return result.data
          } else {
            return null
          }
        } else {
          return null
        }
      }
      return data
    } catch (e) {
      return key ? null : {}
    }
  }

  //将数据写入缓存文件
  public static setCacheData(key: string | number, value: any, config?: FileConfig) {
    const data = this.getCacheData()
    data[key] = {
      data: value,
      createAt: Date.now(),
      aging: config ? config.aging : 0,
      validityPeriod: config ? config.validityPeriod : null,
    }
    const filePath = join(this.cacheFilePath, '../')
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath)
    }
    fs.writeFileSync(this.cacheFilePath, JSON.stringify(data), { encoding: 'utf8' })
  }

  //抛出异常
  public static throwException(status: number, message?: string) {
    throw new HttpException(message || null, status)
  }

  public static getDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
    // lat1,lng1为用户当前位置，lat2,lng2为商家位置
    let radLat1 = (lat1 * Math.PI) / 180.0
    let radLat2 = (lat2 * Math.PI) / 180.0
    let a = radLat1 - radLat2
    let b = (lng1 * Math.PI) / 180.0 - (lng2 * Math.PI) / 180.0
    let s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)))
    s = s * 6378.137 // EARTH_RADIUS;
    s = Math.round(s * 1000)
    return s
  }

  /**
   * 发送邮件
   * @param mail 收件邮箱
   * @param title 标题
   * @param data 内容
   * */
  public static async sendMail(mail: string, title: string, data: string) {
    try {
      const result = await axios.post(ReMailboxInfo.url, {
        mail,
        title,
        data,
      })
      return result.data
    } catch (e) {
      throw e.message
    }
  }

  /**
   * 添加文件流临时文件
   * @param buffer 文件流
   * @param fileName 文件名
   */
  public static addBuffer(buffer: Buffer, fileName: string): string {
    const hash = crypto.createHash('md5')
    const md5 = hash.update(buffer).digest('hex')
    FileBuffer.set(md5, {
      buffer,
      name: fileName,
      time: Date.now(),
    })

    return md5
  }

  /**
   * 获取文件流临时文件
   * @param md5 文件md5
   */
  public static getBuffer(md5: string): BufferCacheInfo {
    const result = FileBuffer.get(md5)
    if (!result) Aide.throwException(400, '文件不存在')
    return result
  }

  /**
   * 清理文件流临时文件
   */
  public static purgeBuffer() {
    const now = Date.now()
    //有效期
    const limit = 1000 * 60
    FileBuffer.forEach((value, key) => {
      if (now - value.time > limit) {
        FileBuffer.delete(key)
      }
    })
  }

  /**
   * 手动分页
   * @param data 数据
   * @param pagination 分页参数
   */
  public static diyPaging<T = any>(data: T[], pagination: Pagination) {
    let stNum = pagination.current < 0 ? 0 : (pagination.current - 1) * pagination.pageSize
    const dataList = data.slice(stNum, stNum + pagination.pageSize)
    return {
      data: dataList,
      current: Number(pagination.current),
      pageSize: Number(pagination.pageSize),
      pageCount: Math.ceil(data.length / pagination.pageSize),
      total: data.length,
    }
  }

  public static async exportExcelModBox(data: any[], sheet: Excel.Worksheet, mergeFields: string[], width = 18) {
    const title = Object.keys(data[0])

    // 设置列
    sheet.columns = title.map(key => ({
      header: key,
      key: key,
      width,
    }))

    // 添加据行
    sheet.addRows(data)
    // 合并单元格
    await this.mergeRowsBox(sheet, mergeFields)

    // 设置框和对齐方式
    sheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      })
    })

    // 设置标题行样式
    const headerRow = sheet.getRow(1)
    headerRow.height = 35
    headerRow.eachCell(cell => {
      cell.font = { size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
    })

    // 溢出换行
    sheet.eachRow(row => {
      row.eachCell(cell => {
        cell.alignment = Object.assign(cell.alignment, { wrapText: true })
      })
    })

    return sheet
  }

  static async mergeRowsBox(sheet: Excel.Worksheet, mergeFields: string[]) {
    // 获取表头
    const headerRow = sheet.getRow(1)

    //合并表头
    let startStr = '000'
    let startIndex = 0
    const topValues = [].concat(headerRow.values)
    //加入一个空值，防止最后一列无法合并
    topValues.push('')
    topValues.forEach((item, index) => {
      if (item.indexOf(startStr) != 0) {
        if (startIndex != index - 1) {
          // 合并单元格
          sheet.mergeCells(1, startIndex, 1, index - 1)
        }
        startStr = item
        startIndex = index
      }
    })

    for (let i = 0; i < mergeFields.length; i++) {
      const mergeField = mergeFields[i]
      // @ts-ignore
      const mergeFieldIndex = headerRow.values.indexOf(mergeField)

      if (mergeFieldIndex === -1) {
        throw new Error(`字段 "${mergeField}" 不存在`)
      }

      let startRow = 2 // 数据从第二行开始
      let endRow = startRow
      let currentValue = sheet.getRow(startRow).getCell(mergeFieldIndex).value

      for (let i = startRow + 1; i <= sheet.rowCount; i++) {
        const row = sheet.getRow(i)
        const cellValue = row.getCell(mergeFieldIndex).value
        if (currentValue == null) {
          startRow = i
          endRow = i
          currentValue = cellValue
        } else if (cellValue === currentValue) {
          endRow = i
        } else {
          if (endRow > startRow) {
            // 合并法规号单元格
            if (!sheet.getCell(startRow, mergeFieldIndex).isMerged) {
              sheet.mergeCells(startRow, mergeFieldIndex, endRow, mergeFieldIndex)
              const mergedCell = sheet.getCell(startRow, mergeFieldIndex)
              mergedCell.alignment = { vertical: 'middle', horizontal: 'center' }
            }
            // 合并所有单元格并计算和（如果包含数字）
            for (let col = 1; col <= sheet.columnCount; col++) {
              const name = headerRow.getCell(col).value
              // @ts-ignore
              if (mergeField != name) {
                continue
              }
              // 从第二列开始，第一列不合并
              let sum = 0
              let containsNumber = false
              for (let rowIdx = startRow; rowIdx <= endRow; rowIdx++) {
                const cell = sheet.getRow(rowIdx).getCell(col)
                if (typeof cell.value === 'number') {
                  sum += cell.value
                  containsNumber = true
                }
              }
              const cell = sheet.getCell(startRow, col)
              if (cell.value == null) break
              if (containsNumber && !cell.isMerged) {
                sheet.mergeCells(startRow, col, endRow, col)
                cell.value = sum
                cell.alignment = { vertical: 'middle', horizontal: 'center' }
              } else if (!cell.isMerged) {
                sheet.mergeCells(startRow, col, endRow, col)
                cell.alignment = { vertical: 'middle', horizontal: 'center' }
              }
            }
          }

          startRow = i
          endRow = i
          currentValue = cellValue
        }
      }

      // 处理最后一组
      if (endRow > startRow) {
        if (!sheet.getCell(startRow, mergeFieldIndex).isMerged && sheet.getCell(startRow, mergeFieldIndex).value != null) {
          sheet.mergeCells(startRow, mergeFieldIndex, endRow, mergeFieldIndex)
          const mergedCell = sheet.getCell(startRow, mergeFieldIndex)
          mergedCell.alignment = { vertical: 'middle', horizontal: 'center' }
        }
        for (let col = 1; col <= sheet.columnCount; col++) {
          const name = headerRow.getCell(col).value

          // @ts-ignore
          if (mergeField != name) {
            continue
          }
          // 从第二列开始，第一列不合并
          let sum = 0
          let containsNumber = false
          for (let rowIdx = startRow; rowIdx <= endRow; rowIdx++) {
            const cell = sheet.getRow(rowIdx).getCell(col)
            if (typeof cell.value === 'number') {
              sum += cell.value
              containsNumber = true
            }
          }
          const cell = sheet.getCell(startRow, col)
          if (containsNumber && !cell.isMerged) {
            sheet.mergeCells(startRow, col, endRow, col)
            cell.value = sum
            cell.alignment = { vertical: 'middle', horizontal: 'center' }
          } else if (!cell.isMerged) {
            sheet.mergeCells(startRow, col, endRow, col)
            cell.alignment = { vertical: 'middle', horizontal: 'center' }
          }
        }
      }
    }
  }
}

// export const _nanoid = customAlphabet('1234567890')
// export const $nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ')

export const getTime = (dto: TimeDto, unit: OpUnitType = 'day') => {
  let endTime = dto.endTime ? dayjs(dto.endTime).endOf(unit) : dayjs().endOf(unit)
  let startTime = dto.startTime ? dayjs(dto.startTime).startOf(unit) : dayjs().startOf(unit)
  if (dto.startTime && !dto.endTime) {
    endTime = startTime.endOf(unit)
  }
  if (!dto.startTime && dto.endTime) {
    startTime = endTime.startOf(unit)
  }
  return {
    endTime,
    startTime,
  }
}

interface PolymerizationConfig {
  key: string[]
  publicKey: string
}

export interface JsExclKey {
  keyName: string
  key: string
  index?: number
}

export interface CellL {
  col: Col[]
  row: any[]
}

export interface Col {
  key: string
  values: any[]
}

export class FileConfig {
  aging?: number //指定文件的过期时间，单位为分钟。默认为 0，表示永不过期。
  validityPeriod?: number //指定时间内有效
}

export interface JsonResult {
  // [key: string]: string | number | null | { [subKey: string]: string | number | null };
  [key: string]: any
}
