import { info, kingdeeServiceConfig } from '@common/config'
import { ApiDict, BOM, BomDetail, Customer, Material, SalesOrder, SalesOrderDetail, Supplier, Organize, User } from '@model/index'
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
      ['物料属性', 'FITEMPPROPERTY', 'attr', v => convertExtends(v, 'FErpClsID')],
      ['物料规格', 'FITEMMODEL', 'spec'],
      ['父项物料单位', 'FUNITID', 'unit'],
      ['版本', 'FNumber', 'version'],
      // ['图号', 'F_ora_BaseProperty', 'figureNumber'],
      // ['订单号', 'F_ora_Text', 'orderNo'],
      ['禁用状态', 'FForbidStatus', 'status', v => !convertBool(convertExtends(v, 'FForbidStatus'))],
    ],
    detailTypes: true, //是否存在详情
    detailKeys: [
      // k3name,k3key,dbFieldName,转化函数
      ['ID', 'FTreeEntity_FENTRYID', 'id'],
      ['子项物料名称', 'FCHILDITEMNAME', 'materialName'],
      ['父项BOM ID', 'FID', 'bomId'],
      ['编码', 'FNumber', 'code'],
      ['物料id', 'FMATERIALIDCHILD.FMasterID', 'materialId'],
      ['用料：分子', 'FNUMERATOR', 'quantity'],
      ['物料规格', 'FCHILDITEMMODEL', 'spec'],
      ['物料属性', 'FCHILDITEMPROPERTY', 'attr'],
      ['子项单位', 'FUNITID', 'unit'],
      ['子项Bom编码', 'FBOMID.FNumber', 'subBomCode'],
      // ['图号', 'F_ora_BaseProperty', 'figureNumber'],
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
  BD_SALESORDER: {
    formID: 'SAL_SaleOrder',
    dbModel: SalesOrder,
    filterString: `FDocumentStatus='C' and FSaleOrgId='${kingdeeServiceConfig.K3_ORG_ID}' and FBillTypeID='eacb50844fc84a10b03d7b841f3a6278'`,
    redisKey: info.appName + 'kingdee:bd_sales_order',
    keys: [
      // k3name,k3key,dbFieldName,转化函数
      ['ID', 'FID', 'id'],
      ['编码', 'FBillNo', 'code'],
      ['日期', 'FDate', 'orderDate'],
      ['客户id', 'FCustId', 'customerId'],
      ['审核日期', 'FApproveDate', 'approveDate'],
      ['审核人', 'FApproverId', 'approveById'],
      ['单据状态', 'FDocumentStatus', 'dataStatus', v => convertExtends(v, 'FDocumentStatus')],
      // ['禁用状态', 'FForbidStatus', 'status', v => !convertBool(convertExtends(v, 'FForbidStatus'))],
    ],
    detailTypes: true, //是否存在详情
    detailKeys: [
      // k3name,k3key,dbFieldName,转化函数
      ['ID', 'FSaleOrderEntry_FEntryID', 'id'],
      ['销售订单id', 'FID', 'salesOrderId'],
      ['物料id', 'FMaterialId.FMasterID', 'materialId'],
      ['物料编码', 'FMaterialId.FNumber', 'materialCode'],
      ['物料名称', 'FMaterialId.FName', 'materialName'],
      ['销售数量', 'FQty', 'quantity'],
      ['销售单位', 'FUnitID.FName', 'unit'],
      // ['即时库存', 'F_ora_Qty', 'oraQty'],
      ['含税单价', 'FTaxPrice', 'unitPrice'],
      ['金额', 'FAmount', 'amount'],
      // ['图号', 'F_ora_BaseProperty_qtr', 'k3StandardDrawingNo'],
      ['BOM ID', 'FBomId', 'bomId'],
      ['要货日期', 'FDeliveryDate', 'deliveryDate'],
    ],
    dbModelDetail: SalesOrderDetail,
    dict: [
      {
        name: '单据类型',
        key: 'FBillTypeID', //金蝶字段名称
        fieldName: 'types', //数据库对应表字段名称
        keyName: 'fid', //字典表对应key字段名称
        valueName: 'content', //字典表对应值字段名称
      },
    ],
  },
}
let a = 'FSaleOrderEntry_FEntryID,FID,FMaterialId.FMasterID,FQty,FUnitID.FName,F_ora_Qty,FTaxPrice,FPrice,FAmount,F_ora_BaseProperty_qtr,FBomId,FDeliveryDate'
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
