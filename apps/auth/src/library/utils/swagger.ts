import { INestApplication } from '@nestjs/common'
import { DocumentBuilder, SwaggerDocumentOptions, SwaggerModule } from '@nestjs/swagger'

//swagger文档 配置
export const swaggerStart = (app: INestApplication, options: SwaggerStartOptions, port: number | string) => {
  try {
    const config = new DocumentBuilder()
      .addBearerAuth()
      .setTitle(options.title)
      .setDescription(options.desc || '')
      .setVersion('1.0')
      .addServer(`http://127.0.0.1:${port}`, '本地')
      .addServer(`http://192.168.31.12:${port}`, '开发')
      .addServer(`${options.home_path}`, '使用环境')
      .build()
    const documentOptions: SwaggerDocumentOptions = {}
    if (options.modules) {
      documentOptions.include = [...(Object.values(options.modules) as Array<Function>)]
    }
    const document = SwaggerModule.createDocument(app, config, documentOptions)
    const prefix = options.path.replace(/\//, '_')
    SwaggerModule.setup(`doc/${options.path}`, app, document, {
      customCss: `.swagger-ui .model-box-control, .swagger-ui .models-control, .swagger-ui .opblock-summary-control {
          all: inherit;
          border-bottom: 0;
          cursor: pointer;
          flex: 1;
          padding: 0;
          user-select: text;
         }`,
      customJsStr: `
          // 保存原生方法
          const originalGetItem = localStorage.getItem.bind(localStorage)
          const originalSetItem = localStorage.setItem.bind(localStorage)
          const authorizationKey = "${prefix}_authorized"
          // 重写 getItem
          localStorage.getItem = function(key) {
            const newKey = key === 'authorized'?authorizationKey:key
            return originalGetItem(newKey)
          }
          // 重写 setItem
          localStorage.setItem = function(key, value) {
            const newKey = key === 'authorized'?authorizationKey:key
            originalSetItem(newKey, value)
          }
        `,
      swaggerOptions: {
        persistAuthorization: true,
      },
    })
    setTimeout(() => {
      console.log(`[${options.title}]`, `http://127.0.0.1:${port}/doc/${options.path}`)
    }, 300)
  } catch (e) {
    console.log(e)
  }
}
interface SwaggerStartOptions {
  modules?: any
  desc?: string
  title: string
  path: string
  home_path: string
}
