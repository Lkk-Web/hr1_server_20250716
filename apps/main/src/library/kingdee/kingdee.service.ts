import axios from 'axios'
import { Aide } from '@library/utils/aide'
import { RedisProvider } from '@library/redis/redis.service'
import { RedisKey } from '@library/redis/redis.keys.config'
import { kingdeeServiceConfig } from '@common/config'

export class KingdeeeService {
  public static async login() {
    let redis = RedisProvider.redisClient
    let url = `${kingdeeServiceConfig.K3_IP}/k3cloud/Kingdee.BOS.WebApi.ServicesStub.AuthService.LoginByAppSecret.common.kdsvc`
    let param = {
      lcid: '2052',
      appId: kingdeeServiceConfig.K3_APPID,
      acctId: kingdeeServiceConfig.K3_ACCTID,
      appSecret: kingdeeServiceConfig.K3_SECRET,
      username: kingdeeServiceConfig.K3_USER,
    }
    console.log('kingdeeServiceConfig:', url, param)
    let res = await axios.post(url, param)
    if (res.status == 200) {
      //根据返回值存储Token至redis失效时间计算方式Create+Validity计算结果
      console.log('k3login:', url, param, res.data)
      let kdservice = res.data.KDSVCSessionId
      let userToken = res.data.Context.SessionId
      let token = `kdservice-sessionid=${kdservice};ASP.NET_SessionId=${userToken}`
      await redis.client.set(RedisKey.K3_TOKEN, token, 'EX', kingdeeServiceConfig.K3_EX)
      return token
    } else {
      Aide.throwException(500, '金蝶系统登录失败，账号异常，请联系管理员！')
    }
  }

  // public static async buildFilterString(fids: string, startTime: string | number | Date, endTime: string | number | Date) {
  //   let filterString = '';

  //   if (fids) {
  //     const fidsArray = fids.split(',');
  //     const fidsFilter = fidsArray.map(fid => `FNumber='${fid}'`).join(' OR ');
  //     filterString += `(${fidsFilter})`;
  //   }

  //   if (startTime && endTime) {
  //     if (filterString) {
  //       filterString += ' AND ';
  //     }
  //     filterString += `(FModifyDate BETWEEN '${new Date(startTime).toISOString()}' AND '${new Date(endTime).toISOString()}')`;
  //   } else if (startTime) {
  //     if (filterString) {
  //       filterString += ' AND ';
  //     }
  //     filterString += `(FModifyDate >= '${new Date(startTime).toISOString()}')`;
  //   } else if (endTime) {
  //     if (filterString) {
  //       filterString += ' AND ';
  //     }
  //     filterString += `(FModifyDate <= '${new Date(endTime).toISOString()}')`;
  //   }

  //   return filterString;
  // }
  /**
   * 查询参数封装方法
   * @param filterParams const filterParams = [
      { key: "FNumber", type: "string", value: "123" },
      { key: "FModifyDate", type: "dateRange", value: { start: "2023-01-01", end: "2023-01-31" } },
      { key: "FQuantity", type: "number", value: 100 },
      { key: "FPrice", type: "range", value: [10, 20] }
  ];
   * @returns
   */
  public static async buildFilterString(filterParams: Array<{ key: string; type: string; value: any }>) {
    let filterString = ''

    for (const param of filterParams) {
      if (!param.key || !param.type || param.value === undefined) {
        continue // 跳过无效的参数
      }

      if (filterString) {
        filterString += ' AND '
      }

      switch (param.type) {
        case 'string':
          filterString += `${param.key} = '${param.value}'`
          break
        case 'number':
          filterString += `${param.key} = ${param.value}`
          break
        case 'date':
          const dateValue = new Date(param.value)
          if (!isNaN(dateValue.getTime())) {
            filterString += `${param.key} = '${dateValue.toISOString()}'`
          }
          break
        case 'dateRange':
          if (param.value && typeof param.value === 'object' && 'start' in param.value && 'end' in param.value) {
            const startDate = new Date(param.value.start)
            const endDate = new Date(param.value.end)
            if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
              filterString += `${param.key} BETWEEN '${startDate.toISOString()}' AND '${endDate.toISOString()}'`
            }
          }
          break
        case 'range':
          if (Array.isArray(param.value) && param.value.length === 2) {
            filterString += `${param.key} BETWEEN ${param.value[0]} AND ${param.value[1]}`
          }
          break
        // 可以根据需要添加更多类型
        default:
          console.warn(`Unsupported type: ${param.type}`)
      }
    }

    return filterString
  }

  /**
   * 金蝶获取纯数组表单列表
   * @param FormId 表单ID，必填
   * @param FieldKeys 查询字段，多个用逗号隔开，必填，可填写字段参考金蝶文档：FNumber,FName
   * @param TopRowCount 最多查到多少行，0是所有，非必填，默认0
   * @param Limit 每页多少行，非必填，默认200
   * @param StartRow 从第几行开始查 ，非必填，默认0，从第一行开始查
   * @param FilterString 搜索条件，SQL Where 条件表达式。如：FQty>=600000 AND FBillNo='CGDD004284'，非必填，默认空
   * @param OrderString 排序条件，ASC-升序，DESC-降序。如：FQty DESC,FBillNo ASC，非必填，默认空
   */
  public static async getExeList(FormId: string, FieldKeys: string, TopRowCount?: number, Limit?: number, StartRow?: number, FilterString?: string, OrderString?: string) {
    if (!FormId) {
      Aide.throwException(500, '表单ID不能为空！')
    }
    let token = await this.getToken()
    let config = {
      withCredentials: true, // 允许携带凭证
      headers: {
        cookie: token,
      },
    }
    let filterAyy = []
    if (FilterString) {
      filterAyy = this.sqlToArray(FilterString)
    }
    const url = `${kingdeeServiceConfig.K3_IP}/k3cloud/Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.ExecuteBillQuery.common.kdsvc`
    const results = []
    let currentStartRow = StartRow || 0
    const pageSize = Limit || 200
    let hasMore = true
    while (hasMore) {
      const param = {
        data: {
          FormId: FormId, // 需要查询表单的ID
          TopRowCount: TopRowCount ? TopRowCount : 0, // 最多查到多少行，0是所有
          Limit: pageSize, // 每页多少行
          StartRow: currentStartRow, // 从第几行开始查
          FilterString: filterAyy, // 搜索条件
          OrderString: OrderString, // 排序条件
          FieldKeys: FieldKeys, // 查询字段，多个用逗号隔开，必填
        },
      }
      const { data } = await axios.post(url, param, config)
      if (data && data.length > 0) {
        if (data[0][0]?.Result) {
          let err = data[0][0].Result
          if (err.ResponseStatus.Errors[0].Message == '会话信息已丢失，请重新登录') {
            await this.login()
            Aide.throwException(500, '登录过期请重新请求！')
          } else {
            Aide.throwException(500, err.ResponseStatus.Errors[0].Message)
          }
        }
        results.push(...data)
        currentStartRow += pageSize
      } else {
        if (data?.Result) {
          let err = data.Result
          if (err.ResponseStatus.Errors[0].Message == '会话信息已丢失，请重新登录') {
            await this.login()
            Aide.throwException(500, '登录过期请重新请求！')
          } else {
            Aide.throwException(500, err.ResponseStatus.Errors[0].Message)
          }
        }
        hasMore = false
      }
      // 如果 TopRowCount 不为 0 且当前结果数量达到或超过 TopRowCount，则停止循环
      if (TopRowCount && results.length >= TopRowCount) {
        hasMore = false
      }
    }
    return results
  }

  /**
   * 金蝶获取表单带参列表
   * @param FormId 表单ID，必填
   * @param FieldKeys 查询字段，多个用逗号隔开，必填，可填写字段参考金蝶文档：FNumber,FName
   * @param TopRowCount 最多查到多少行，0是所有，非必填，默认0
   * @param Limit 每页多少行，非必填，默认200
   * @param StartRow 从第几行开始查 ，非必填，默认0，从第一行开始查
   * @param FilterString 搜索条件，SQL Where 条件表达式。如：FQty>=600000 AND FBillNo='CGDD004284'，非必填，默认空
   * @param OrderString 排序条件，ASC-升序，DESC-降序。如：FQty DESC,FBillNo ASC，非必填，默认空
   */
  public static async getList(FormId: string, FieldKeys: string, FilterString?: string, TopRowCount?: number, Limit?: number, StartRow?: number, OrderString?: string) {
    if (!FormId) {
      Aide.throwException(500, '表单ID不能为空！')
    }
    let filterAyy = []
    if (FilterString) {
      filterAyy = this.sqlToArray(FilterString)
    }
    let token = await this.getToken()
    const config = {
      withCredentials: true, // 允许携带凭证
      headers: {
        cookie: token,
      },
    }
    const url = `${kingdeeServiceConfig.K3_IP}/k3cloud/Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.BillQuery.common.kdsvc`
    const results = []
    let currentStartRow = StartRow || 0
    const pageSize = Limit || 10000
    let hasMore = true

    while (hasMore) {
      const param = {
        data: {
          FormId: FormId, // 需要查询表单的ID
          TopRowCount: TopRowCount ? TopRowCount : 0, // 最多查到多少行，0是所有
          Limit: pageSize, // 每页多少行
          StartRow: currentStartRow, // 从第几行开始查
          FilterString: filterAyy, // 搜索条件
          OrderString: OrderString, // 排序条件
          FieldKeys: FieldKeys, // 查询字段，多个用逗号隔开，必填
        },
      }

      const { data } = await axios.post(url, param, config)
      if (data && data.length > 0) {
        if (data[0][0]?.Result) {
          let err = data[0][0].Result
          if (err.ResponseStatus.Errors[0].Message == '会话信息已丢失，请重新登录') {
            await this.login()
            Aide.throwException(500, '登录过期请重新请求！')
          } else {
            Aide.throwException(500, err.ResponseStatus.Errors[0].Message)
          }
        }
        results.push(...data)
        currentStartRow += pageSize
      } else {
        if (data?.Result) {
          let err = data.Result
          if (err.ResponseStatus.Errors[0].Message == '会话信息已丢失，请重新登录') {
            await this.login()
            Aide.throwException(500, '登录过期请重新请求！')
          } else {
            Aide.throwException(500, err.ResponseStatus.Errors[0].Message)
          }
        }
        hasMore = false
      }
      // 如果 TopRowCount 不为 0 且当前结果数量达到或超过 TopRowCount，则停止循环
      if (TopRowCount && results.length >= TopRowCount) {
        hasMore = false
      }
    }
    return results
  }

  /**
   * 金蝶获取表单带参列表
   * @param FormId 表单ID，必填
   * @param fid 金蝶id，金蝶id与金蝶编码必须填一个
   * @param code 金蝶编码，金蝶id与金蝶编码必须填一个
   * @param orgId 组织编码
   */
  public static async getOne(FormId: string, fid?: string, code?: string, orgId?: string) {
    if (!FormId) {
      Aide.throwException(500, '表单ID不能为空！')
    }
    if (!fid && !code) {
      Aide.throwException(500, '金蝶id与金蝶编码必须填一个！')
    }
    let token = await this.getToken()
    const config = {
      withCredentials: true, // 允许携带凭证
      headers: {
        cookie: token,
      },
    }
    const url = `${kingdeeServiceConfig.K3_IP}/k3cloud/Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.View.common.kdsvc`
    const param = {
      formid: FormId, // 需要查询表单的ID
      data: {
        CreateOrgId: orgId ? orgId : 0, // 组织编码
        Number: code ? code : '', // 金蝶编码
        Id: fid ? fid : '', // 金蝶id
        IsSortBySeq: false, // 单据体是否按序号排序，默认false
      },
    }
    const { data } = await axios.post(url, param, config)
    return data
  }

  /**
   * 金蝶获取表单带参列表
   * @param FormId 表单ID，必填
   * @param FieldKeys 查询字段，多个用逗号隔开，必填，可填写字段参考金蝶文档：FNumber,FName
   * @param FilterString 搜索条件，SQL Where 条件表达式。如：FQty>=600000 AND FBillNo='CGDD004284'，非必填，默认空
   * @param Limit 每页多少行，非必填，默认200
   * @param StartRow 从第几行开始查 ，非必填，默认0，从第一行开始查
   * @param OrderString 排序条件，ASC-升序，DESC-降序。如：FQty DESC,FBillNo ASC，非必填，默认空
   */
  public static async getListV2(FormId: string, FieldKeys: string, FilterString?: string, Limit?: number, StartRow?: number, OrderString?: string) {
    if (!FormId) {
      Aide.throwException(500, '表单ID不能为空！')
    }
    let token = await this.getToken()
    let filterAyy = []
    if (FilterString) {
      filterAyy = this.sqlToArray(FilterString)
    }
    const config = {
      withCredentials: true, // 允许携带凭证
      headers: {
        cookie: token,
      },
    }
    const url = `${kingdeeServiceConfig.K3_IP}/k3cloud/Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.BillQuery.common.kdsvc`
    const pageSize = Limit || 200
    const param = {
      data: {
        FormId: FormId, // 需要查询表单的ID
        TopRowCount: 0, // 最多查到多少行，0是所有
        Limit: pageSize, // 每页多少行
        StartRow: StartRow, // 从第几行开始查
        FilterString: filterAyy, // 搜索条件
        OrderString: OrderString, // 排序条件
        FieldKeys: FieldKeys, // 查询字段，多个用逗号隔开，必填
      },
    }
    console.log('param: ', param)
    const { data } = await axios.post(url, param, config)
    console.log(data.Result)
    if (data.Result && !data.Result.ResponseStatus.IsSuccess) throw data.Result.ResponseStatus.Errors[0].Message
    return data
  }
  /**
   * 获取金蝶表单元信息
   * @param FormId - 数据表ID
   * @returns - meta数据
   */
  public static async getMeta(FormId: string) {
    const config = await this.autoLogin()
    const url = `${kingdeeServiceConfig.K3_IP}/k3cloud/Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.QueryBusinessInfo.common.kdsvc`
    const param = {
      formid: FormId, // 需要查询表单的ID
      data: { FormId },
    }
    const { data } = await axios.post(url, param, config)
    console.log('data: ', data)
    return data
  }
  /**
   * 获取金蝶表关联表
   * @param FormId - 数据表ID
   * @returns - meta数据
   */
  public static async getGroup(FormId: string, GroupFieldKey: string) {
    const config = await this.autoLogin()
    const url = `${kingdeeServiceConfig.K3_IP}/k3cloud/Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.QueryGroupInfo.common.kdsvc`
    const param = {
      formid: FormId, // 需要查询表单的ID
      data: { FormId, GroupFieldKey },
    }
    const { data } = await axios.post(url, param, config)
    console.log('data: ', data)
    return data
  }
  /**
   * 解析从金蝶获取的表单列表数据
   * @param data - 二维数组，每个子数组包含与 fieldKeys 对应的数据
   * @param mappingKeys - K3Mapping中的keys
   * @param dictKey - 字典表中的key
   * @param dictFieldKey - 实际表中的字段名
   * @param dictDataList - 字典表数据
   * @returns - 对象数组，每个对象包含由 fieldKeys 指定的字段和对应的值
   */
  public static parseKingdeeDataByMapping(data: string[][], mappingKeys: any[][], dictKey?: string[], dictFieldKey?: string[], dictDataList?: string[][][]) {
    // 将 fieldKeys 字符串分割成字段数组
    const keys = mappingKeys.map(v => v[1])
    // 迭代数据数组，将每个子数组转换成对象
    return data.map(row => {
      // 创建一个新对象，使用 keys 和 row 中的值来填充
      const obj = {}
      keys.forEach((key, index) => {
        let [, , newKey, func] = mappingKeys[index]
        let val = row[key]
        obj[newKey] = func ? func(val) : val
      })

      dictKey.forEach((v, index) => {
        let newKey = row[v]
        let val
        dictDataList[index].forEach(dict => {
          if (dict[0] == newKey) {
            val = dict[1]
          }
        })
        obj[dictFieldKey[index]] = val
      })

      return obj
    })
  }

  /**
   * 解析从金蝶获取的字典列表数据
   * @param data - 二维数组，每个子数组包含与 fieldKeys 对应的数据
   * @param mappingKeys - K3Mapping中的keys
   * @returns - 对象数组，每个对象包含由 fieldKeys 指定的字段和对应的值
   */
  public static parseKingdeeDict(data: string[][], mappingKeys: any[][], name: string) {
    // 将 fieldKeys 字符串分割成字段数组
    const keys = mappingKeys.map(v => v[1])
    // 迭代数据数组，将每个子数组转换成对象
    return data.map(row => {
      // 创建一个新对象，使用 keys 和 row 中的值来填充
      const obj = {
        name: name,
        xtName: '金蝶',
      }
      keys.forEach((key, index) => {
        let [, , newKey, func] = mappingKeys[index]
        let val = row[key]
        obj[newKey] = func ? func(val) : val
      })
      return obj
    })
  }

  /**
   * 解析从金蝶获取的表单列表数据
   * @param fieldKeys - 逗号分隔的字符串，指定返回结果中的字段名
   * @param data - 二维数组，每个子数组包含与 fieldKeys 对应的数据
   * @param defaultValue - 对象，用于设置扩展的默认值
   * @returns - 对象数组，每个对象包含由 fieldKeys 指定的字段和对应的值
   */
  public static async parseKingdeeFormData(fieldKeys: string, data: string[][], defaultValue?: {}) {
    // 将 fieldKeys 字符串分割成字段数组
    const keys = fieldKeys.split(',')
    // 迭代数据数组，将每个子数组转换成对象
    return data.map(row => {
      // 创建一个新对象，使用 keys 和 row 中的值来填充
      const obj = { ...defaultValue }
      keys.forEach((key, index) => {
        obj[key] = row[index]
      })
      return obj
    })
  }

  // 辅助函数，自动登录
  public static async autoLogin() {
    let token = await this.getToken()
    return {
      withCredentials: true, // 允许携带凭证
      headers: {
        cookie: token,
      },
    }
  }
  private static async getToken() {
    let redis = RedisProvider.redisClient
    let token = await redis.client.get(RedisKey.K3_TOKEN)
    if (!token) {
      token = await this.login()
    }
    return token
  }
  private static async request(action: string, params: any, needToken: boolean = true) {
    const url = `${kingdeeServiceConfig.K3_IP}/k3cloud/${action}`
    let headers = {}

    if (needToken) {
      const token = await this.getToken()
      headers = { Cookie: token }
    }

    try {
      const response = await axios.post(url, params, { headers })
      if (response.status === 200) {
        return response.data
      }
      throw new Error(`请求失败: ${response.status}`)
    } catch (error: any) {
      const errorMsg = error?.response?.data?.Message || error.message
      throw new Error(`金蝶接口调用失败: ${errorMsg}`)
    }
  }
  public static async save(formId: string, data: any) {
    return
    const params = {
      FormId: formId,
      Data: data,
    }

    return this.request('Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.Save.common.kdsvc', params)
  }
  public static async submit(formId: string, data: any) {
    return
    const params = {
      FormId: formId,
      Data: data,
    }

    return this.request('Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.Submit.common.kdsvc', params)
  }
  public static async audit(formId: string, data: any) {
    return
    const params = {
      FormId: formId,
      Data: data,
    }

    return this.request('Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.Audit.common.kdsvc', params)
  }
  public static async unAudit(formId: string, data: any) {
    const params = {
      FormId: formId,
      Data: data,
    }

    return this.request('Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.UnAudit.common.kdsvc', params)
  }
  /**
   * 单据下推
   * formId:下推的单据名称
   * 对应参数：data:{
        "Ids": "",
        "Numbers": [],
        "EntryIds": "",
        "RuleId": "",
        "TargetBillTypeId": "",
        "TargetOrgId": 0,
        "TargetFormId": "",
        "IsEnableDefaultRule": "false",
        "IsDraftWhenSaveFail": "false",
        "CustomParams": {}
      }
    2.1.Ids：单据内码集合，字符串类型，格式："Id1,Id2,..."（使用内码时必录）
     2.2.Numbers：单据编码集合，数组类型，格式：[No1,No2,...]（使用编码时必录）
     2.3.EntryIds：分录内码，逗号分隔（分录下推时必录） 注（按分录下推时，单据内码和编码不需要填,否则按整单下推）
     2.4.RuleId：转换规则内码，字符串类型（未启用默认转换规则时，则必录）
     2.5.TargetBillTypeId：目标单据类型内码，字符串类型（非必录）
     2.6.TargetOrgId：目标组织内码，整型（非必录）
     2.7.TargetFormId：目标单据FormId，字符串类型，（启用默认转换规则时，则必录）
     2.8.IsEnableDefaultRule：是否启用默认转换规则，布尔类型，默认false（非必录）
     2.9.IsDraftWhenSaveFail：保存失败时是否暂存，布尔类型，默认false（非必录）  注（暂存的单据是没有编码的）
     2.10.CustomParams：自定义参数，字典类型，格式："{key1:value1,key2:value2,...}"（非必录）  注（传到转换插件的操作选项中，平台不会解析里面的值）
   *
   * */
  public static async push(formId: string, data: any) {
    return
    const params = {
      FormId: formId,
      Data: data,
    }
    return this.request('Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.Push.common.kdsvc', params)
  }
  /**业务操作
   * formId:单据名称
   * data:单据数据
   * opNumber:操作编码
   */
  public static async ExcuteOperation(formId: string, data: any, opNumber: string) {
    const params = {
      FormId: formId,
      opNumber: opNumber,
      Data: data,
    }
    return this.request('Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.ExcuteOperation.common.kdsvc', params)
  }

  /**
   * 将 SQL 查询条件转换为金蝶查询数组格式
   * @param sql
   * @private
   */
  private static sqlToArray(sql: string) {
    // 替换非标准运算符并规范空格
    sql = sql.replace(/=>/g, '>=').replace(/\s+/g, ' ').trim()

    // 定义运算符映射
    const operatorMap = {
      '>=': '39',
      '<=': '56',
      '=': '67',
      '>': '72',
      '<': '44',
      like: 'like', // 特殊处理
    }

    // 特殊字段的运算符映射
    const specialMap = {
      'FDocumentStatus=': '105',
      'FStatus=': '105',
      'FBillType=': '105',
      'FBillTypeID=': '105',
      'FMoEntryStatus=': '29',
    }

    // 解析逻辑关系 - 智能分词器
    const tokens = sql
      .split(/(\band\b|\bor\b)/i)
      .map(t => t.trim())
      .filter(Boolean)

    const result = []
    const operatorPattern = Object.keys(operatorMap)
      .sort((a, b) => b.length - a.length)
      .map(op => op.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|')
    const valuePattern = `(?:(["'])(.*?)\\1|(\\S+))`
    for (let i = 0; i < tokens.length; i++) {
      // 跳过逻辑运算符
      if (tokens[i] === 'and' || tokens[i] === 'or') continue

      const condition = tokens[i]

      // 支持字段名中的点（.）和引号包裹的值
      const pattern = new RegExp(`([\\w.]+)\\s*(${operatorPattern})\\s*${valuePattern}`, 'i')

      const match = condition.match(pattern)
      // console.log(match,condition)
      if (!match) throw new Error(`Invalid condition: ${condition}`)

      let [, field, op, , , value] = match
      op = op.toLowerCase()

      // 处理LIKE运算符的特殊情况
      let compareCode = operatorMap[op]
      if (op === 'like') {
        if (value.startsWith('%') && value.endsWith('%')) {
          compareCode = '17' // 模糊查询
        } else if (value.startsWith('%')) {
          compareCode = '60' // 左包含
        } else if (value.endsWith('%')) {
          compareCode = '211' // 右包含
        } else {
          compareCode = '17' // 默认模糊查询
        }
      }

      // 应用特殊字段映射
      const opKey = `${field}${op === 'like' ? '=' : op}`
      if (specialMap[opKey]) {
        compareCode = specialMap[opKey]
      }

      // 确定逻辑关系
      let logic = 0
      if (i > 0) {
        const prevToken = tokens[i - 1]
        if (prevToken === 'or') {
          logic = 1
        } else if (prevToken === 'and') {
          logic = 0
        }
      }

      // 对于LIKE操作，移除值中的通配符
      if (op === 'like') {
        value = value.replace(/%/g, '')
      }
      //取消对引号的处理
      if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1)
      } else if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1)
      }

      result.push({
        FieldName: field,
        Compare: compareCode,
        Value: value,
        Left: '',
        Right: '',
        Logic: result.length === 0 ? 0 : logic,
      })
    }

    return result
  }
}
