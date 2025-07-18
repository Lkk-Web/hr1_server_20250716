import { Pagination } from '@common/interface'
import { Injectable } from '@nestjs/common'
import { NotifyPageDto } from './notify.dto'
import { Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { Notify } from '@model/index'
import dayjs = require('dayjs')

@Injectable()
export class NotifyService {
  constructor(
  ) { }

  public async notifyPage(dto: NotifyPageDto, pagination: Pagination) {


    const options: FindPaginationOptions = {
      where: {},
      attributes:{exclude:["userId"]},
      pagination,
      include: [
        { association: 'team',attributes:['name']},
        { association: 'processTask',attributes:['id','status'],include:[
            {association:'order',attributes:['code']}
          ]},
      ],
    }
    if(dto.status==0){
      options.where['readTime'] = null
    }else if(dto.status==1){
      options.where['readTime'] = {[Op.not]:null}
    }
    if(dto.teamId)options.where['teamId'] = dto.teamId
    if(dto.scene)options.where['scene'] = dto.scene
    if(dto.name)options.where['scene'] = dto.name
    if(dto.createdAt){
      const dayData = dayjs(dto.createdAt);
      options.where['createdAt'] = {
        [Op.gte]: dayData.startOf('day').toDate(),
        [Op.lte]: dayData.endOf('day').toDate(),
      }
    }

    if(dto.code){
      options.include[1].include[0].where = {
        code:{
        [Op.like]: `%${dto.code}%`
      }
      };
      options.include[1].required = true;
    }

    const result = await Notify.findPagination<Notify>(options)
    return result
  }

  //已读
  public async read(id: number) {
    await Notify.update({readTime:Date.now()},{where:{id,readTime:null}});
    return true;
  }
}
