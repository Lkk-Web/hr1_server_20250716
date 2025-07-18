export * from './logExternalAPIRequest.model'

/* ----------基础资料--------- */
export * from './base/material.model'
export * from './base/bom.model'
export * from './base/bomSubItem.model'
export * from './base/supplier.model'
export * from './base/workShop.model'
export * from './base/workCenter.model'
export * from './base/customer.model'
export * from './base/workCenterOfPOP.model'
// 动态表单
export * from './base/trendsTemplate.model'
export * from './base/trendsField.model'

// 系统管理
export * from './sys/SYSMenu.model'
export * from './sys/SYSOrg.model'
export * from './sys/SYSRole.model'
export * from './sys/SYSRoleMenu.model'
export * from './sys/SYSUserRole.model'
export * from './sys/SYSRoleOrg.model'
export * from './sys/user.model'
export * from './sys/apiConfig.model'
export * from './sys/apiDict.model'

//质量管理
export * from './quantity/defectiveItem.model'
export * from './quantity/inspectionItem.model'
export * from './quantity/inspectionTemplate.model'
export * from './quantity/inspectionTemplateItem.model'
export * from './quantity/inspectionTemplateMat.model'
export * from './quantity/inspectionForm.model'
export * from './quantity/inspectionFormBy.model'
export * from './quantity/InspectionFormItem.model'
export * from './quantity/InspectionFormItemRecord.model'
export * from './quantity/batchLog.model'
export * from './quantity/inspectionFormInfo.model'
export * from './quantity/inspectionFormResult.model'

//工艺管理1
export * from './pm/process.model'
export * from './pm/processItems.model'
export * from './pm/processDept.model'

//基础资料2

export * from './wm/warehouse.model'
export * from './wm/warehouseMaterial.model'

//文件管理
export * from './dm/FileMenu.model'
export * from './dm/FileList.model'
export * from './dm/FileVersion.model'

//工艺管理2
export * from './pm/processRoute.model'
export * from './pm/processRouteList.model'
export * from './pm/processRouteListItem.model'
export * from './pm/SOP.model'
export * from './pm/SOPMaterial.model'
export * from './pm/SOPFile.model'

//生产计划
export * from './ps/salesOrder.model'
export * from './ps/salesOrderDetail.model'

//生产执行
export * from './pe/productionOrder.model'
export * from './pe/POP.model'
export * from './pe/PODmodel'
export * from './pe/POI.model'
export * from './pe/POB.model'
export * from './pe/POBD.model'

export * from './pe/processTask.model'
export * from './pe/processTaskDept.model'
export * from './pe/processTaskUser.model'

export * from './pe/productionReport.model'
export * from './pe/PRI.model'

export * from './pe/productionOutsourcing.model' //工序委外
export * from './pe/processTaskLog.model' //工序委外

export * from './pe/reportUser.model'
export * from './pe/reportUserDuration.model'

//绩效管理
export * from './pp/performanceConfig.model'
export * from './pp/performance.model'
export * from './pp/performanceDetailed.model'
export * from './pp/manHour.model'
export * from './pp/manHourProcess.model'

//打印模版
export * from './sys/printTemplate.model'

//排班管理
export * from './sm/teamType.model'
export * from './sm/team.model'
export * from './sm/teamUser.model'
export * from './sm/shift.model'
export * from './sm/shiftPeriod.model'
export * from './sm/calendar.model'
export * from './sm/calendarDetail.model'
export * from './sm/schedulePlan.model'
export * from './sm/schedulePlanShift.model'
export * from './sm/planShiftTeam.model'
export * from './sm/teamEquipmentLedger.model'
export * from './sm/teamProcess.model'
export * from './sm/notify.model'

//库存管理
export * from './wm/inboundOrder.model'
export * from './wm/inboundOrderDetail.model'
export * from './wm/outboundOrder.model'
export * from './wm/outboundOrderDetail.model'
export * from './wm/adjustOrder.model'
export * from './wm/adjustOrderDetail.model'
export * from './wm/transferOrder.model'
export * from './wm/transferOrderDetail.model'
export * from './wm/materialRequisition.model'
export * from './wm/materialRequisitionDetail.model'
export * from './wm/exportOrder.model'
export * from './wm/exportOrderDetail.model'
export * from './wm/PRO.model'
export * from './wm/PRODetail.model'

//设备管理
export * from './em/equipmentType.model'
export * from './em/equipment.model'
export * from './em/installLocation.model'
export * from './em/checkStandard.model'
export * from './em/checkStandardDetail.model'
export * from './em/inspectionPlan.model'
export * from './em/inspectionPlanDetail.model'
export * from './em/equipmentLedger.model'
export * from './em/checkOrder.model'
export * from './em/checkOrderDetail.model'
export * from './em/inspectionOrder.model'
export * from './em/inspectionOrderDetail.model'
export * from './em/repairOrder.model'
export * from './em/repairOrderDetail.model'
export * from './em/repairOrderResult.model'
export * from './em/repairOrderReceive.model'
export * from './em/maintenancePlan.model'
export * from './em/maintenancePlanDetail.model'
export * from './em/maintenanceOrder.model'
export * from './em/maintenanceOrderDetail.model'
export * from './em/scrapOrder.model'



// 数据中台
export * from './io/dcNotify.model'
export * from './io/drawing.model'
export * from './io/craft.model'

