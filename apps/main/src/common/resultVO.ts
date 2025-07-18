import { ApiProperty } from '@nestjs/swagger'

export class ResultVO<T> {
  @ApiProperty({ name: 'code', required: true, description: '响应状态码', type: String })
  code: number = 200;

  @ApiProperty({ name: 'msg', required: true, description: '响应信息', type: String })
  msg: string = "success";

  @ApiProperty({ name: 'data', required: false, description: '响应数据', type: Object })
  data: T | null = null;

  constructor(data?: T, code?: number, msg?: string) {
    if (code !== undefined) this.code = code;
    if (msg !== undefined) this.msg = msg;
    if (data !== undefined) this.data = data;
  }

  success(data?: T, msg: string = 'success', code: number = 200): ResultVO<T> {
    this.data = data;
    this.code = code;
    this.msg = msg;
    return this;
  }

  fail(data?: T, msg: string = 'fail', code: number = 400): ResultVO<T> {
    this.data = data;
    this.code = code;
    this.msg = msg;
    return this;
  }

}
