import { Injectable } from '@nestjs/common'
import { PerformanceDetailDto, PerformanceListDto, PerformanceListRes } from './performance.dto'
import { ProductionOrder, ProductionReport, ReportUser, Team, TeamUser } from '@model/index'
import { Op, Sequelize } from 'sequelize'
import { Includeable } from 'sequelize/types/model'
import { Aide, getTime } from '@library/utils/aide'
import { Pagination } from '@common/interface'
import { FindPaginationOptions, PaginationResult } from '@model/shared/interface'
import _ = require('lodash')
import Excel = require('exceljs')
import dayjs = require('dayjs')

@Injectable()
export class PerformanceService {
  // 编写按照工时统计的接口
  public async getManHourStatistic(dto: PerformanceListDto) {
    const where: any = {}
    const include: Includeable[] = []
    if (dto.teamName) {
      where.name = {
        [Op.like]: `%${dto.teamName}%`,
      }
    }
    if (dto.isOut != null) {
      where.isOut = dto.isOut
    }
    if (dto.userName) {
      include.push({
        association: 'users',
        attributes: [],
        where: {
          userName: {
            [Op.like]: `%${dto.userName}%`,
          },
        },
        through: { attributes: [] },
      })
    }
    const teams = await Team.findAll({
      where,
      attributes: ['id', 'name', 'type'],
      include,
    })
    if (!teams.length) return []
    const teamIds = teams.map(item => item.id)
    const prWhere: any = { teamId: teamIds }
    if (dto.startTime || dto.startTime) {
      const { startTime, endTime } = getTime(dto, 'day')
      prWhere.createdAt = {
        [Op.lte]: endTime.valueOf(),
        [Op.gte]: startTime.valueOf(),
      }
    }
    const prList = await ProductionReport.findAll({
      where: prWhere,
      attributes: ['reportQuantity', 'goodCount', 'teamId'],
      include: [
        { association: 'reportUsers', attributes: ['duration'] },
      ],
    })

    const result: PerformanceListRes[] = teamIds.map(v => {
      const team = teams.find(item => item.id == v)
      if (!team) return
      const pr = prList.filter(item => item.teamId == v)
      const goodCount = pr.reduce((a, b) => a + b.goodCount, 0)
      const duration = pr.reduce((a, b) => a + b.reportUsers.reduce((c, d) => c + d.duration, 0), 0)
      const planCount = pr.reduce((a, b) => a + b.reportQuantity, 0)
      const goodPr = (goodCount / planCount) * 100
      return {
        teamId: v,
        name: team.name,
        goodCount,
        duration,
        goodPr,
      }
    })

    return result

  }

  //绩效明细
  public async getPerformanceDetail(dto: PerformanceDetailDto, pagination: Pagination,isAll=false) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
      include: [
        {
          association: 'userDuration', attributes: ['userId'],where:{
            w1:Sequelize.literal(`(select stu.id from sm_team_user as stu where stu.teamId ${Array.isArray(dto.teamId)?`in(${dto.teamId.join(",")})`:`=${dto.teamId}`} and stu.userId=userDuration.userId) is not null`)
          }, include: [
            { association: 'user', attributes: ['userName'] },
          ],
        },
        {
          association:'productionReport',attributes: ['id','startTime', 'endTime','productionOrderId','createdAt','reportQuantity','goodCount'],
          include: [
            { association: 'process', attributes: ['processName'] },
          ],
        }
      ],
    }
    if(dto.userName){
      options.include[0].required = true;
      options.include[0].include[0].where = {
        userName: {
          [Op.like]: `%${dto.userName}%`,
        },
      }
    }

    if (dto.startTime || dto.startTime) {
      const { startTime, endTime } = getTime(dto, 'day')
      options.include[1].where = {
        createdAt:{
          [Op.lte]: endTime.valueOf(),
          [Op.gte]: startTime.valueOf(),
        }
      }
    }
    let result:PaginationResult<ReportUser>;
    if(isAll){
      const list = await ReportUser.findAll(options);
      result = {
        total: list.length,
        data:list,
        current: list.length,
        pageCount: 1,
        pageSize: list.length
      }
    }else{
      result = await ReportUser.findPagination<ReportUser>(options);
    }

    if (result.data.length) {
      let prList = result.data.filter(v=>v.productionReport).map(v=>v.productionReport)
      const orders = await ProductionOrder.findAll({
        where:{id:_.uniq(prList.map(v=>v.productionOrderId))},
        attributes: ['id','code'],
        include: [
          { association: 'bom', attributes: ['spec','attr'],include:[
              {association:'parentMaterial',attributes:['code','name']},
            ] },
        ],
      });

      result.data = result.data.map(v=>{
        v = v.toJSON();
        if(v.productionReport){
          v.productionReport.order=orders.find(item => item.id == v.productionReport.productionOrderId)
        }
        return v;
      })
    }
    return result
  }

  //导出
  public async export(dto:PerformanceListDto) {
    const statistic:PerformanceListRes[] = await this.getManHourStatistic(dto);
    if(!statistic.length) Aide.throwException(400029)
    // @ts-ignore
    const {data:detail}= await this.getPerformanceDetail({teamId:statistic.map(v=>v.teamId)},{} as Pagination,true);

    const workbook = new Excel.Workbook();
    workbook.creator = "nestjs";
    workbook.lastModifiedBy = "nestjs";
    workbook.created = new Date();
    workbook.modified = new Date();
    const data1= statistic.map((v,i)=>({
      "序号":i+1,
      '部门名称':v.name,
      '良品数':v.goodCount,
      '核算工时（小时）':(v.duration? v.duration/3600:0).toFixed(2),
      '良品率%':v.goodPr||0
    }));
    const data2:any[] = [];

    const [teamUsers] = await Promise.all([
      TeamUser.findAll({where:{teamId:_.uniq(statistic.map(v=>v.teamId))}}),
      Aide.exportExcelModBox(data1, await workbook.addWorksheet("汇总表"),[],15)
    ]);
    detail.forEach((v,i)=>{
      data2.push({
        "序号":i+1,
        "部门名称":statistic.find(temp=>teamUsers.find(vv=>vv.teamId==temp.teamId&&vv.userId==v.userDuration.userId))?.name||"-",
        "员工姓名":v.userDuration.user.userName,
        "工单编号":v.productionReport?.order?.code||'',
        "产品编号":v.productionReport?.order?.bom.parentMaterial.code||'',
        "产品名称":v.productionReport?.order?.bom.parentMaterial.name||'',
        "工序":v.productionReport?.process.processName||'',
        "报工开始时间":dayjs(v.productionReport?.startTime||Date.now()).format("YYYY-MM-DD HH:mm:ss"),
        "报工结束时间":dayjs(v.productionReport?.endTime||Date.now()).format("YYYY-MM-DD HH:mm:ss"),
        "核算工时（小时）":v.duration?v.duration/3600:0,
      })
    })
    await Aide.exportExcelModBox(data2, await workbook.addWorksheet("明细表"),[],20);

    let buffer:any = await workbook.xlsx.writeBuffer()
    buffer = Buffer.from(buffer, "binary");
    const {startTime,endTime} = getTime(dto)
    return {
      md5:Aide.addBuffer(buffer,`rtzk.工时统计明细表${startTime.format("YYYY_MM_DD")}到${endTime.format("YYYY_MM_DD")}.xlsx`)
    }
  }

}
