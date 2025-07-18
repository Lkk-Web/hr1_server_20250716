import { map } from 'rxjs/operators'
import E from '@common/error'
import { Injectable } from '@nestjs/common'
import axios from 'axios'

function keysMapping(keys, values) {
  const results = []
  for (let i = 0; i < values.length; i++) {
    const value = values[i]
    const result = {}
    if (keys.length !== value.length) {
      // console.log('keysMapping with invalid length.', keys.length, value.length)
    } else {
      keys.forEach((key, i) => (result[key] = value[i]))
      results.push(result)
    }
  }
  return results
}

@Injectable()
export class K3Service {
  private config: any
  private request: any
  private cookie: string
  constructor() {
    this.config = {
      // baseURL: 'http://111.230.193.170/k3cloud',
      // accid: '64b9d9155bc467', // 数据中心
      lcid: 2052,
      apis: {
        // webapi
        authPath: '/Kingdee.BOS.WebApi.ServicesStub.AuthService.ValidateUser.common.kdsvc',
        listPath: '/Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.ExecuteBillQuery.common.kdsvc',
        metaPath: '/Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.QueryBusinessInfo.common.kdsvc',
        getPath: '/Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.View.common.kdsvc',
        savePath: '/Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.Save.common.kdsvc',
        batchSavePath: '/Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.BatchSave.common.kdsvc',
        submitPath: '/Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.Submit.common.kdsvc',
        getSysReportData: '/Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.GetSysReportData.common.kdsvc',
      },
    }
      ; (this.request = axios.create({
        timeout: 60000,
        headers: {
          'Content-Type': 'application/json',
        },
      })),
        //半小时清理过期cookie
        setInterval(() => {
          console.log('清理过期cookie')
          this.cookie = ''
        }, 1000 * 60 * 30)
  }

  /*----------------------*/
  async fetch(url, payload, cookie, k3Params) {
    // console.log('send:', k3Params.baseURL + url, payload, cookie, k3Params)
    let ret = await this.request.post(k3Params.baseURL + url, payload, { headers: { cookie } })
    return ret
  }

  // 登录
  async auth(username, password, k3Params) {
    if (this.cookie) {
      return { cookie: this.cookie }
    }
    const { lcid } = this.config
    const accid = k3Params.appID
    const parameters = [accid, username, password, lcid]
    const { authPath } = this.config.apis
    if (!authPath) throw E.API_ERROR // new Error(`invalid api path: ${authPath}`)
    const payload = { parameters }

    const { headers, data } = await this.request.post(k3Params.baseURL + authPath, payload)
    const { IsSuccessByAPI, Message } = data

    if (!IsSuccessByAPI) {
      throw E.K3_API_ERROR(Message)
    }

    const cookie = headers['set-cookie'] || []
    this.cookie = cookie.join(';')
    return {
      cookie: cookie.join(';'),
      data,
    }
  }
  // 查询一个
  async getOne(param, k3Params) {
    let list = await this.list(param, k3Params)
    return list.length > 0 ? list[0] : null
  }
  // 查询元数据
  async meta({ cookie, formId }, k3Params, keyValues = false, onlyKey = false) {
    const config = this.config
    if (!formId || !cookie) throw E.INVALID_PARAMS
    const FormId = formId
    const payload = {
      data: { FormId },
    }

    const resp = await this.fetch(config.apis.metaPath, payload, cookie, k3Params)
    if (keyValues) {
      if (resp && resp.data && resp.data.Result && resp.data.Result.NeedReturnData) {
        const entries = resp.data.Result.NeedReturnData.Entrys

        if (onlyKey) {
          resp.data = entries.flatMap(item => item.Fields.map(field => field.Key))
        } else {
          resp.data = entries.map(item =>
            item.Fields.map(field => ({
              key: field.Key,
              name: field.Name[0].Value,
            }))
          )
        }
      }
    }

    return resp.data
  }
  // 查询报表数据
  async getSysReportData({ cookie, formId, fieldKeys, filterString = '', limit = 0, skip = 0, orderString = '' }, k3Params) {
    const config = this.config

    if (!formId || !fieldKeys.length || !cookie) throw E.INVALID_PARAMS
    const { getSysReportData } = config.apis
    if (!getSysReportData) throw E.API_ERROR
    const FormId = formId
    const FieldKeys = fieldKeys.join(',')
    const payload = {
      FormId,
      data: {
        FieldKeys,
        SchemeId: '',
        StartRow: 0,
        Limit: 2000,
        IsVerifyBaseDataField: 'true',

        Model: {
          FSaleOrgId: '1,100082,100083,306341',
          FStartDate: '2023-12-01 00:00:00',
          FEndDate: '2023-12-18 00:00:00',
          FFormStatus: 'C',
          FIsIncludeSerMat: true,
          FSuite: 'All',
          FSettleOrgList: '100082,100083,306341',
        },
      },
    }
    //return payload
    const resp = await this.fetch(getSysReportData, payload, cookie, k3Params)
    console.log('payload: ', payload)
    // console.log(resp.data.length)
    return resp.data
    const results = keysMapping(fieldKeys, resp.data)
    return results
  }
  // 查询列表
  async view({ cookie, formId, data }, k3Params) {
    const config = this.config
    if (!formId || !cookie) throw E.INVALID_PARAMS
    const FormId = formId
    const payload = {
      FormId,
      data,
    }

    const resp = await this.fetch(config.apis.getPath, payload, cookie, k3Params)
    return resp.data
  }
  // 查询列表
  async list({ cookie, formId, fieldKeys, filterString = '', limit = 0, skip = 0, orderString = '' }, k3Params) {
    const config = this.config

    if (!formId || !fieldKeys.length || !cookie) throw E.INVALID_PARAMS
    const { listPath } = config.apis
    if (!listPath) throw E.API_ERROR
    const FormId = formId
    const FieldKeys = fieldKeys.join(',')
    const payload = {
      FormId,
      data: {
        FormId,
        FieldKeys,
        Limit: limit || 1000,
        StartRow: skip || 0,
        OrderString: orderString || '',
        FilterString: filterString,
        // [{ "Left": "(", "FieldName": "FID", "Compare": "=", "Value": "642009", "Right": ")", "Logic": ";" }]
      },
    }
    //return payload
    const resp = await this.fetch(listPath, payload, cookie, k3Params)
    // console.log(resp.data.length)
    const results = keysMapping(fieldKeys, resp.data)
    return results
  }

  // 保存
  async save({ cookie, formId, data }, k3Params) {
    const config = this.config
    if (!formId || !data || !cookie) throw E.INVALID_PARAMS
    const FormId = formId
    const payload = {
      FormId,
      data,
    }
    const resp = await this.fetch(config.apis.savePath, payload, cookie, k3Params)
    return resp.data
  }
  // 批量保存
  async batchSave({ cookie, formId, data }, k3Params) {
    const config = this.config
    if (!formId || !data || !cookie) throw E.INVALID_PARAMS
    const FormId = formId
    const payload = {
      FormId,
      data,
    }
    const resp = await this.fetch(config.apis.batchSavePath, payload, cookie, k3Params)
    return resp.data
  }
  // 提交
  async submit({ cookie, formId, ids }, k3Params) {
    const config = this.config
    if (!ids || !cookie) throw E.INVALID_PARAMS
    const FormId = formId
    const payload = {
      FormId,
      data: { Ids: ids },
    }
    const resp = await this.fetch(config.apis.submitPath, payload, cookie, k3Params)
    return resp.data
  }
}
