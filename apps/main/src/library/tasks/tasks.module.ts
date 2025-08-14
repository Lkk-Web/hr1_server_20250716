import { Module } from '@nestjs/common'
import { TasksService } from './tasks.service'
import { TasksTwoMethod } from './tasksTwo.method'
import { MiModule } from '@modules/admin/mi/mi.module'

@Module({
  imports: [MiModule],
  providers: [TasksService, TasksTwoMethod],
})
export class TasksModule {}
