import { Module } from '@nestjs/common'
import * as index from './index'

@Module({
  imports: [...Object.values(index)],
  controllers: [],
  providers: [],
  exports: [],
})
export class PlatformPadModule { }
