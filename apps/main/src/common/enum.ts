export enum APP_ENV {
  dev = 'dev',
  test = 'test',
  prod = 'prod',
}

export enum PLATFORM {
  client = 'client',
  admin = 'admin',
  station = 'station',
}

export enum DC_NOTIFY_ACTION {
  mainDataUpdate = 'mainDataUpdate', //数据更新
  mainDataUpdateSyncAll = 'mainDataUpdateSyncAll', //全量同步
}

export enum PROCESS_TASK_LOG_TYPE {
  start = 1, //开始
  pause = 5, //暂停
  resume = 8, //恢复
  finish = 10, //完成
}

//未开始 执行中 暂停 已结束
export enum PROCESS_TASK_STATUS {
  notStart = '未开始',
  running = '执行中',
  pause = '暂停',
  finish = '已结束',
}

// 审核中, 待分配, 执行中, 已完成
export enum POSITION_TASK_STATUS {
  TO_ASSIGN = '待派工',
  NOT_STARTED = '未开始',
  IN_PROGRESS = '执行中',
  PAUSED = '已暂停',
  COMPLETED = '已完成',
}

export enum NOTIFY_SCENE {
  PAD_M_O = 'PAD物料催单',
  PAD_M_A = 'PAD物料申请',
}

export enum PERFORMANCE_CONFIG_UNIT {
  hour = '小时',
  square = '平方',
}

export enum PERFORMANCE_CONFIG_TYPE {
  criteria = '标准',
  sales = '售后',
  out = '外包',
}

export enum FIXTURE_STATUS {
  PENDING = '待领用',
  RECEIVED = '已领用',
}

export enum TEAM_TYPE {
  output = '生产',
  inspection = '质检',
}

export enum OUTER_SALES_ORDER_STATUES {
  notProduced = '未生产', //订单中的生产订单无一个开工
  inProduction = '生产中', //订单中的生产订单有一个开工
  completed = '已完工', //生产订单都结束
}

export enum NOTIFY_TYPE {
  routingCreate = '310', // 工艺流程卡创建
  routingEdit = '301', // 工艺流程卡修改
  sopCreate = '300', // 工艺图纸sop与工艺路线
}

/** 生产订单任务状态枚举 */
export enum ProductionOrderTaskStatus {
  NOT_STARTED = '未开始',
  IN_PROGRESS = '执行中',
  PAUSED = '已暂停',
  CANCELLED = '已取消',
  COMPLETED = '已完成',
}

export enum SchedulingStatus {
  NOT_SCHEDULED = '未排程',
  SCHEDULED = '已排程',
}

/** 产品序列号状态枚举 */
export enum ProductSerialStatus {
  NOT_STARTED = '未开始',
  IN_PROGRESS = '执行中',
  COMPLETED = '已完成',
  SCRAPPED = '已报废',
}

export enum ROLE_CODE {
  SUPER_ADMIN = '0000',
  ADMIN = '0001', // 管理员
  MANAGE = '0002', // 生产经理
  OPERATOR = '0003', // 班组长
  PLANER = '0004', // 计划员
  USER = '0005', // 员工/普通用户
}

export enum AuditStatus {
  PENDING_REVIEW = '待审核',
  APPROVED = '已通过',
  REJECTED = '已驳回',
}
