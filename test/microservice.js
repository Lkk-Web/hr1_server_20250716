/**
 * 微服务TCP连接测试脚本
 * 用于测试Auth微服务的健康检查和token验证功能
 */

const { ClientProxy, ClientProxyFactory, Transport } = require('@nestjs/microservices')

// 创建微服务客户端
const client = ClientProxyFactory.create({
  transport: Transport.TCP,
  options: {
    host: '127.0.0.1',
    port: 7999,
  },
})

async function testMicroservice() {
  try {
    // 连接到微服务
    await client.connect()
    console.log('✅ 微服务 TCP://127.0.0.1:3001 连接成功!')

    const healthResult = await client.send('auth.health.check', {}).toPromise()
    console.log('✅ 健康检查结果:', JSON.stringify(healthResult, null, 2))

    const invalidTokenResult = await client
      .send('auth.verify.token', {
        token: 'invalid-token',
        platform: 'admin',
      })
      .toPromise()
    console.log('📝 无效token验证结果:', JSON.stringify(invalidTokenResult, null, 2))

    // 测试token验证
    const emptyTokenResult = await client
      .send('auth.verify.token', {
        token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImFkbWluIiwiaWQiOjEsImlhdCI6MTc1MjQ3MzQ2NywiZXhwIjoxNzUyOTA1NDY3fQ.iBHtq6bwp1WRTV7UKUe077twI-GpSBRhMLG49dAzazg',
        platform: 'admin',
      })
      .toPromise()
    console.log('✅ 有效token验证结果:', JSON.stringify(emptyTokenResult, null, 2))

    console.log('\n🎉 所有测试完成!')
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 请确保Auth微服务正在运行在 TCP://localhost:7999')
    }
  } finally {
    // 关闭连接
    await client.close()
    console.log('🔌 连接已关闭')
  }
}

// 运行测试
testMicroservice().catch(console.error)
