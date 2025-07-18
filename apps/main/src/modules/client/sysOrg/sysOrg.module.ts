import { Module } from '@nestjs/common'
import { SysOrgController } from './sysOrg.controller'
import { SysOrgService } from './sysOrg.service'

@Module({
  imports: [],
  controllers: [SysOrgController],
  providers: [SysOrgService],
  exports: [],
})
export class SysOrgModule {}
