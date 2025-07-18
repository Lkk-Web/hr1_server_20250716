import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Body, Get, HttpCode, HttpException, HttpStatus, Inject, Injectable, Logger, Post, Put, Query } from '@nestjs/common'
import { OpenAuthorize } from '@core/decorator/metaData'
import axios from 'axios'
import { nanoid } from 'nanoid'

@Injectable()
export class HookService {
  constructor() // @Inject(RedisProvider.local)
  // private readonly redis: SuperRedis,

  {}

  private readonly logger = new Logger(HookService.name)
}
