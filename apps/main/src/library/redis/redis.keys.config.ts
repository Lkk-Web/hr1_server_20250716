import { Material } from '@model/index'
import _ = require('lodash')

export const RedisKey = {
  K3_UPDATE_DATE: {
    BD_MATERIAL: process.env.APP_NAME + ':K3_UPDATE_DATE:BD_MATERIAL',
    BD_SYS: process.env.APP_NAME + ':K3_UPDATE_DATE:BD_SYS',
  },
  K3_TOKEN: process.env.APP_NAME + ':K3:TOKEN1',
}
