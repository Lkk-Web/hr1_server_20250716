import { Module } from '@nestjs/common'
import { FileController } from './file.controller'
import { FileDto } from './file.dto'
import { MulterModule } from '@nestjs/platform-express'
import * as mcx from 'multer-cos-x'
import { COS_CONFIG } from '@common/config'
import { nanoid } from 'nanoid'

@Module({
  imports: [
    MulterModule.register({
      storage: mcx({ cos: COS_CONFIG,
        filename: (req, file, cb) => {
          const originalname = decodeURI(file.originalname)
          let name = originalname.substring(0,originalname.lastIndexOf('.'))
          name=name.replace(/[\s]/g,"_") //替换空格
          name=name.substring(0,20) //限制名字长度

          let suffix = originalname.substring(originalname.lastIndexOf('.'))
          const filename = `${nanoid(6)}/${name+suffix}`
          return cb(null, filename)
        }
      }),
    }),
  ],
  controllers: [FileController],
  providers: [FileDto],
  exports: [],
})
export class FileModule {}
