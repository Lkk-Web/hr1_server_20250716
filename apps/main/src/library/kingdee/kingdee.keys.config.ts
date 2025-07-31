import { info, kingdeeServiceConfig } from '@common/config'
import { ApiDict, BOM, BomDetail, Customer, Material, SalesOrder, SalesOrderDetail, Supplier, Organize, User, ProductionOrder, POB, POBDetail } from '@model/index'
import { ProductionOrderDetail } from '@model/production/productionOrderDetail.model'
import _ = require('lodash')

export const K3Mapping = {
  BD_SYS_ORG: {
    formID: 'BD_Department',
    dbModel: Organize,
    filterString: `FUseOrgId='${kingdeeServiceConfig.K3_ORG_ID}'`,
    redisKey: info.appName + 'kingdee:bd_sys_org',
    keys: [
      // k3name,k3key,dbFieldName,转化函数
      ['ID', 'FDEPTID', 'id'],
      ['编码', 'FNumber', 'code'],
      ['名称', 'FName', 'shortName'],
      ['部门全称', 'FFullName', 'name'],
      ['部门属性', 'FDeptProperty.FDataValue', 'attr'],
      ['上级部门', 'FParentID', 'parentId', v => v || null],
      ['禁用状态', 'FForbidStatus', 'status', v => !convertBool(convertExtends(v, 'FForbidStatus'))],
    ],
    detailTypes: false, //是否存在详情
    detailKeys: [],
  },
  BD_SYS_USER: {
    formID: 'BD_Empinfo',
    dbModel: User,
    filterString: `FUseOrgId='${kingdeeServiceConfig.K3_ORG_ID}'`,
    redisKey: info.appName + 'kingdee:bd_sys_user',
    keys: [
      // k3name,k3key,dbFieldName,转化函数
      ['ID', 'FID', 'id'],
      ['员工姓名', 'FNumber', 'userCode'],
      ['员工编码', 'FName', 'userName'],
      ['移动电话', 'FMobile', 'phone'],
      ['禁用状态', 'FForbidStatus', 'status', v => !convertBool(convertExtends(v, 'FForbidStatus'))],
    ],
    detailTypes: false, //是否存在详情
    detailKeys: [],
    dict: [
      {
        name: '员工任岗信息',
        key: 'FID',
        fieldName: 'departmentId',
        keyName: 'content1',
        valueName: 'content',
      },
    ],
  },
  BD_MATERIAL: {
    formID: 'BD_MATERIAL',
    dbModel: Material,
    filterString: `FUseOrgId='${kingdeeServiceConfig.K3_ORG_ID}'`,
    redisKey: info.appName + 'kingdee:bd_material',
    keys: [
      // k3name,k3key,dbFieldName,转化函数
      ['ID', 'FMasterID', 'id'],
      ['编码', 'FNumber', 'code'],
      ['名称', 'FName', 'materialName'],
      ['描述', 'FDescription', 'remark'],
      ['规格型号', 'FSpecification', 'spec'],
      ['数据状态', 'FDocumentStatus', 'k3DataStatus', v => convertExtends(v, 'FDocumentStatus')],
      ['物料属性', 'FErpClsID', 'attribute', v => convertExtends(v, 'FErpClsID')],
      ['禁用状态', 'FForbidStatus', 'status', v => !convertBool(convertExtends(v, 'FForbidStatus'))],
      ['基本单位', 'FBaseUnitId.FName', 'unit'],
    ],
    detailTypes: false, //是否存在详情
    detailKeys: [],
    dbModelDetail: Material,
  },
  BD_BOM: {
    formID: 'ENG_BOM',
    dbModel: BOM,
    filterString: `FDocumentStatus='C' and FUseOrgId='${kingdeeServiceConfig.K3_ORG_ID}'`,
    redisKey: info.appName + 'kingdee:bd_sys_user',
    // pageSize:1000,
    keys: [
      // k3name,k3key,dbFieldName,转化函数
      ['ID', 'FID', 'id'],
      ['编码', 'FNumber', 'code'],
      ['物料id', 'FMATERIALID.FMasterID', 'materialId'],
      ['物料名称', 'FITEMNAME', 'materialName'],
      ['物料属性', 'FITEMPPROPERTY', 'attribute', v => convertExtends(v, 'FErpClsID')],
      ['物料规格', 'FITEMMODEL', 'spec'],
      ['版本', 'FNumber', 'version'],
      ['BOM 分组', 'FGroup.FNumber', 'group'],
      ['BOM 分组名称', 'FGroup.FName', 'groupName'],
      ['禁用状态', 'FForbidStatus', 'status', v => !convertBool(convertExtends(v, 'FForbidStatus'))],
    ],
    detailTypes: true, //是否存在详情
    detailKeys: [
      ['ID', 'FTreeEntity_FENTRYID', 'id'],
      ['子项单位', 'FUNITID.FName', 'unit'],
      ['子项物料规格', 'FCHILDITEMMODEL', 'spec'],
      ['子项物料名称', 'FCHILDITEMNAME', 'materialName'],
      ['子项物料属性', 'FCHILDITEMPROPERTY', 'attribute', v => convertExtends(v, 'FErpClsID')],
      ['父项BOM ID', 'FID', 'bomId'],
      ['编码', 'FNumber', 'code'],
      ['物料id', 'FMATERIALIDCHILD.FMasterID', 'materialId'],
      ['用料：分子', 'FNUMERATOR', 'molecule'],
    ],
    dbModelDetail: BomDetail,
    dict: [],
  },
  BD_SUPPLIER: {
    formID: 'BD_Supplier',
    dbModel: Supplier,
    filterString: `FUseOrgId='${kingdeeServiceConfig.K3_ORG_ID}'`,
    redisKey: info.appName + 'kingdee:bd_supplier',
    keys: [
      // k3name,k3key,dbFieldName,转化函数
      ['ID', 'FSupplierId', 'id'],
      ['供应商编码', 'FNumber', 'code'],
      ['供应商名称', 'FName', 'fullName'],
      ['供应商简称', 'FShortName', 'shortName'],
      ['禁用状态', 'FForbidStatus', 'status', v => !convertBool(convertExtends(v, 'FForbidStatus'))],
    ],
    detailTypes: false, //是否存在详情
    detailKeys: [],
    dict: [],
  },
  BD_CUSTOMER: {
    formID: 'BD_Customer_All',
    dbModel: Customer,
    filterString: `FUseOrgId='${kingdeeServiceConfig.K3_ORG_ID}'`,
    redisKey: info.appName + 'kingdee:bd_customer',
    keys: [
      // k3name,k3key,dbFieldName,转化函数
      ['ID', 'FCUSTID', 'id'],
      ['客户编码', 'FNumber', 'code'],
      ['客户名称', 'FName', 'fullName'],
      ['客户分类', 'FShortName', 'types'],
      ['禁用状态', 'FForbidStatus', 'status', v => !convertBool(convertExtends(v, 'FForbidStatus'))],
    ],
    detailTypes: false, //是否存在详情
    detailKeys: [],
    dict: [],
  },
  SAL_SALESORDER: {
    formID: 'SAL_SaleOrder',
    dbModel: SalesOrder,
    filterString: `FDocumentStatus='C' and FSaleOrgId='${kingdeeServiceConfig.K3_ORG_ID}' and FBillTypeID='eacb50844fc84a10b03d7b841f3a6278'`,
    redisKey: info.appName + 'kingdee:sales_order',
    keys: [
      ['ID', 'FID', 'id'],
      ['编码', 'FBillNo', 'code'],
      ['日期', 'FDate', 'orderDate'],
      ['客户id', 'FCustId', 'customerId'],
      ['审核日期', 'FApproveDate', 'approveDate'],
      ['审核人', 'FApproverId', 'approveById'],
      ['单据类型', 'FBillTypeID.FName', 'types'],
      ['单据状态', 'FDocumentStatus', 'dataStatus', v => convertExtends(v, 'FDocumentStatus')],
    ],
    detailTypes: true, //是否存在详情
    dbModelDetail: SalesOrderDetail,
    detailKeys: [
      ['ID', 'FSaleOrderEntry_FEntryID', 'id'],
      ['销售订单id', 'FID', 'salesOrderId'],
      ['物料id', 'FMaterialId.FMasterID', 'materialId'],
      ['物料编码', 'FMaterialId.FNumber', 'materialCode'],
      ['物料名称', 'FMaterialId.FName', 'materialName'],
      ['销售数量', 'FQty', 'quantity'],
      ['销售单位', 'FUnitID.FName', 'unit'],
      ['含税单价', 'FTaxPrice', 'unitPrice'],
      ['金额', 'FAmount', 'amount'],
      ['BOM ID', 'FBomId', 'bomId'],
      ['要货日期', 'FDeliveryDate', 'deliveryDate'],
      ['备注', 'FEntryNote', 'remark'],
      ['金蝶原始数据', '', 'jsonData'],
    ],
  },
  PRD_MO: {
    formID: 'PRD_MO',
    remark: '生产订单',
    dbModel: ProductionOrder,
    filterString: `FDocumentStatus='C' and FStatus='4'`,
    redisKey: info.appName + 'kingdee:production_order',
    keys: [
      ['金蝶ID', 'FID', 'id'],
      ['销售订单id', 'FSaleOrderId', 'salesOrderId'],
      ['金蝶编码', 'FBillNo', 'kingdeeCode'],
      ['单据日期', 'FDate', 'orderDate'],
      ['单据类型', 'FBillType.FName', 'billType'],
      ['单据状态', 'FDocumentStatus', 'status', v => convertExtends(v, 'FDocumentStatus')],
    ],
    detailTypes: true, //是否存在详情
    dbModelDetail: ProductionOrderDetail,
    detailKeys: [
      ['ID', 'FTreeEntity_FEntryId', 'id'],
      ['生产订单Id', 'FID', 'productionOrderId'],
      ['物料编码id', 'FMaterialId', 'materialId'],
      ['计划产出 (数量)', 'FQty', 'plannedOutput'],
      ['计划开工时间', 'FPlanStartDate', 'startTime'],
      ['计划完工时间', 'FPlanFinishDate', 'endTime'],
      ['生产车间', 'FWorkShopID.FName', 'workShop'],
      ['产品订单编号', 'FBillNo', 'orderCode'],
      ['金蝶原始数据', '', 'jsonData'],
    ],
  },
  PRD_PPBOM: {
    formID: 'PRD_PPBOM',
    remark: '生产用料清单',
    dbModel: POB,
    filterString: `FCreateDate>='2025-05-25' and FMoEntryStatus='4' and FMOType.FName = '汇报入库-普通生产'`,
    redisKey: info.appName + 'kingdee:production_POB',
    pageSize: 1000,
    keys: [
      ['金蝶ID', 'FID', 'id'],
      ['工单id', 'FMOEntryID', 'productionOrderDetailId'],
      ['金蝶编码', 'FBillNo', 'kingdeeCode'],
      ['物料Id', 'FMaterialID.FMasterID', 'materialId'],
      ['bomId', 'FBOMID', 'bomId'],
      ['数量', 'FQty', 'quantity'],
      ['单据状态', 'FMoEntryStatus', 'status'],
    ],
    detailTypes: true, //是否存在详情
    dbModelDetail: POBDetail,
    detailKeys: [
      ['ID', 'FEntity_FEntryId', 'id'],
      ['用料清单Id', 'FID', 'pobId'],
      ['子项物料编码id', 'FMaterialID2.FMasterID', 'materialId'],
      ['项次', 'FReplaceGroup', 'item'],
      ['使用比例', 'FUseRate', 'ratio'],
      ['分子', 'FNumerator', 'numerator'],
      ['应发数量', 'FMustQty', 'sendCount'],
      ['已领数量', 'FPickedQty', 'receivedCount'],
      ['未领数量', 'FNoPickedQty', 'unclaimedCount'],
      ['金蝶原始数据', '', 'jsonData'],
    ],
  },
}

export const K3DictMapping = [
  {
    name: '岗位信息',
    formID: 'HR_ORG_HRPOST',
    dbModel: ApiDict,
    keys: [
      // k3name,k3key,dbFieldName,转化函数
      ['金蝶id', 'FPOSTID', 'fid'],
      ['编码', 'FNumber', 'code'],
      ['岗位名称', 'FName', 'content'],
      ['所属部门id', 'FDept', 'content1'],
      ['部门名称', 'FFullName', 'content2'],
    ],
  },
  {
    name: '物料类别',
    formID: 'BD_MATERIALCATEGORY',
    dbModel: ApiDict,
    keys: [
      // k3name,k3key,dbFieldName,转化函数
      ['金蝶id', 'FCATEGORYID', 'fid'],
      ['编码', 'FNumber', 'code'],
      ['类别名称', 'FName', 'content'],
    ],
  },
  {
    name: '单位',
    formID: 'BD_UNIT',
    dbModel: ApiDict,
    keys: [
      // k3name,k3key,dbFieldName,转化函数
      ['金蝶id', 'FUNITID', 'fid'],
      ['编码', 'FNumber', 'code'],
      ['单位名称', 'FName', 'content'],
    ],
  },
  {
    name: '单据类型',
    formID: 'BOS_BillType',
    dbModel: ApiDict,
    keys: [
      // k3name,k3key,dbFieldName,转化函数
      ['金蝶id', 'FBILLTYPEID', 'fid'],
      ['编码', 'FNumber', 'code'],
      ['单据名称', 'FName', 'content'],
      ['单据fromid', 'FBillFormID', 'content1'],
    ],
  },
  {
    name: '员工任岗信息',
    formID: 'BD_NEWSTAFF',
    dbModel: ApiDict,
    keys: [
      // k3name,k3key,dbFieldName,转化函数
      ['金蝶id', 'FSTAFFID', 'fid'],
      ['员工名称', 'FName', 'code'],
      ['所属部门', 'FDept', 'content'],
      ['员工id', 'FEmpInfoId', 'content1'],
    ],
    filterString: "FIsFirstPost='1'",
  },
]

// 传入值和extends转换数组
const convertExtends = (value, k3key) => {
  return _.find(K3Extends[k3key], { Value: value })?.Caption
}

// 传是否，返回bool
const convertBool = value => {
  return value == '是'
}

const K3Extends = {
  FDocumentStatus: [
    {
      Value: 'Z',
      Caption: '暂存',
      Seq: 0,
      Invalid: false,
    },
    {
      Value: 'A',
      Caption: '创建',
      Seq: 2,
      Invalid: false,
    },
    {
      Value: 'B',
      Caption: '审核中',
      Seq: 3,
      Invalid: false,
    },
    {
      Value: 'C',
      Caption: '已审核',
      Seq: 4,
      Invalid: false,
    },
    {
      Value: 'D',
      Caption: '重新审核',
      Seq: 5,
      Invalid: false,
    },
  ],
  FForbidStatus: [
    {
      Value: 'A',
      Caption: '否',
      Seq: 1,
      Invalid: false,
    },
    {
      Value: 'B',
      Caption: '是',
      Seq: 2,
      Invalid: false,
    },
  ],
  FErpClsID: [
    {
      Value: '10',
      Caption: '资产',
      Seq: 5,
      Invalid: false,
    },
    {
      Value: '9',
      Caption: '配置',
      Seq: 4,
      Invalid: false,
    },
    {
      Value: '2',
      Caption: '自制',
      Seq: 2,
      Invalid: false,
    },
    {
      Value: '11',
      Caption: '费用',
      Seq: 6,
      Invalid: false,
    },
    {
      Value: '12',
      Caption: '模型',
      Seq: 9,
      Invalid: false,
    },
    {
      Value: '5',
      Caption: '虚拟',
      Seq: 6,
      Invalid: false,
    },
    {
      Value: '7',
      Caption: '一次性',
      Seq: 8,
      Invalid: false,
    },
    {
      Value: '13',
      Caption: '产品系列',
      Seq: 10,
      Invalid: false,
    },
    {
      Value: '3',
      Caption: '委外',
      Seq: 3,
      Invalid: false,
    },
    {
      Value: '4',
      Caption: '特征',
      Seq: 5,
      Invalid: false,
    },
    {
      Value: '6',
      Caption: '服务',
      Seq: 7,
      Invalid: false,
    },
    {
      Value: '1',
      Caption: '外购',
      Seq: 1,
      Invalid: false,
    },
  ],
}
