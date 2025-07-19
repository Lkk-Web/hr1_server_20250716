import { info } from '@common/config'
import _ = require('lodash')

export const RedisKey = {
  K3_UPDATE_DATE: {
    BD_MATERIAL: info.appName + ':K3_UPDATE_DATE:BD_MATERIAL',
    BD_SYS: info.appName + ':K3_UPDATE_DATE:BD_SYS',
  },
  K3_TOKEN: info.appName + ':K3:TOKEN',
}
