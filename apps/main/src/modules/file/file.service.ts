import { Injectable } from '@nestjs/common'
import { COS_CONFIG } from '@common/config'
import * as COS from 'cos-nodejs-sdk-v5'
import { _nanoid } from '@library/utils/aide'

@Injectable()
export class FileService {
  constructor() {}
  private cos: COS = null;

  public getCos() {
    if (!this.cos) {
      this.cos = new COS({
        SecretId: COS_CONFIG.SecretId,
        SecretKey: COS_CONFIG.SecretKey, // 密钥key
      });
    }
    return this.cos;
  }

  public async uploadFile(file: Express.Multer.File) {
    const cos = this.getCos();
    const fileName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const suffix = fileName.substring(
        file.originalname.lastIndexOf('.'),
    );
    const putObjectResult = await new Promise((resolve, reject) => {
      cos.putObject(
          {
            Bucket: COS_CONFIG.Bucket,
            Region: COS_CONFIG.Region,
            Key: `/${COS_CONFIG.dir}/${_nanoid(3)}/${fileName.replace(suffix, '')}${suffix}`,
            Body: file.buffer,
          },
          function (err, data) {
            if (err) {
              reject(err);
              return;
            }
            resolve(data);
          },
      );
    });
    let result = `https://${putObjectResult['Location']}`
    if (COS_CONFIG.domain) {
      result = result.replace(
          /[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+\.?/,
          COS_CONFIG.domain,
      );
    }

    return decodeURI(result);
  }
}
