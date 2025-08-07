export enum APP_ENV {
  dev = 'dev',
  test = 'test',
  prod = 'prod',
}

export enum PLATFORM {
  admin = 'admin', // 管理端
  client = 'client', // 移动端
  planning = 'planning', // 计划端
  station = 'station', // 工位端
  dashboard = 'dashboard', // 看板端
}

export enum request_Method {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

export enum TEAM_TYPE {
  output = '生产',
  inspection = '质检',
}

export enum ROLE_CODE {
  SUPER_ADMIN = '0000',
  ADMIN = '0001',
  MANAGE = '0002',
  OPERATOR = '0003',
  PLANER = '0004',
  USER = '0005',
}
