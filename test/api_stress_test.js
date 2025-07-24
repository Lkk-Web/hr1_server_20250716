const https = require('https');
const http = require('http');
const { URL } = require('url');

// API配置
const API_CONFIG = {
  url: 'http://127.0.0.1:32963/admin/v1/workShop/findPagination?name=%E8%BD%A6%E9%97%B4A&status=true',
  headers: {
    'accept': '*/*',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImFkbWluIiwiaWQiOjEzNDAzMCwiaWF0IjoxNzUzMzM3OTAwLCJleHAiOjE3NTM3Njk5MDB9.4P9h0EWdYdT3omu8-aPenddyjxVvg6jHWeLhGEFTL24'
  }
};

// 测试配置
const TEST_CONFIG = {
  totalRequests: 100,
  concurrency: 10, // 并发数
  timeout: 30000   // 超时时间(毫秒)
};

// 统计信息
const stats = {
  total: 0,
  success: 0,
  failed: 0,
  errors: {},
  responseTimes: [],
  startTime: null,
  endTime: null
};

/**
 * 发送单个HTTP请求
 * @param {string} url - 请求URL
 * @param {object} headers - 请求头
 * @returns {Promise} 请求结果
 */
function makeRequest(url, headers) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: headers,
      timeout: TEST_CONFIG.timeout
    };

    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        resolve({
          statusCode: res.statusCode,
          responseTime: responseTime,
          data: data,
          headers: res.headers
        });
      });
    });

    req.on('error', (error) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      reject({
        error: error.message,
        responseTime: responseTime
      });
    });

    req.on('timeout', () => {
      req.destroy();
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      reject({
        error: 'Request timeout',
        responseTime: responseTime
      });
    });

    req.end();
  });
}

/**
 * 执行单次测试
 * @param {number} requestId - 请求ID
 */
async function executeRequest(requestId) {
  try {
    const result = await makeRequest(API_CONFIG.url, API_CONFIG.headers);
    
    stats.total++;
    stats.success++;
    stats.responseTimes.push(result.responseTime);
    
    console.log(`✅ 请求 ${requestId}: 状态码 ${result.statusCode}, 响应时间 ${result.responseTime}ms`);
    
    // 可选：打印响应数据的前100个字符
    if (result.data && result.data.length > 0) {
      const preview = result.data.substring(0, 100);
      console.log(`   响应预览: ${preview}${result.data.length > 100 ? '...' : ''}`);
    }
    
  } catch (error) {
    stats.total++;
    stats.failed++;
    
    const errorType = error.error || 'Unknown Error';
    stats.errors[errorType] = (stats.errors[errorType] || 0) + 1;
    
    console.log(`❌ 请求 ${requestId}: 失败 - ${errorType}, 响应时间 ${error.responseTime || 0}ms`);
  }
}

/**
 * 批量执行请求
 * @param {number} batchSize - 批次大小
 */
async function executeBatch(batchSize) {
  const promises = [];
  
  for (let i = 0; i < batchSize; i++) {
    const requestId = stats.total + i + 1;
    promises.push(executeRequest(requestId));
  }
  
  await Promise.all(promises);
}

/**
 * 计算统计信息
 */
function calculateStats() {
  if (stats.responseTimes.length === 0) {
    return {
      avgResponseTime: 0,
      minResponseTime: 0,
      maxResponseTime: 0,
      p95ResponseTime: 0
    };
  }
  
  const sortedTimes = stats.responseTimes.sort((a, b) => a - b);
  const sum = sortedTimes.reduce((acc, time) => acc + time, 0);
  const avg = sum / sortedTimes.length;
  const min = sortedTimes[0];
  const max = sortedTimes[sortedTimes.length - 1];
  const p95Index = Math.floor(sortedTimes.length * 0.95);
  const p95 = sortedTimes[p95Index];
  
  return {
    avgResponseTime: Math.round(avg),
    minResponseTime: min,
    maxResponseTime: max,
    p95ResponseTime: p95
  };
}

/**
 * 打印最终统计报告
 */
function printFinalReport() {
  const duration = stats.endTime - stats.startTime;
  const calculatedStats = calculateStats();
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 API压力测试报告');
  console.log('='.repeat(60));
  console.log(`🎯 目标URL: ${API_CONFIG.url}`);
  console.log(`⏱️  测试时长: ${duration}ms (${(duration / 1000).toFixed(2)}秒)`);
  console.log(`📈 总请求数: ${stats.total}`);
  console.log(`✅ 成功请求: ${stats.success} (${((stats.success / stats.total) * 100).toFixed(2)}%)`);
  console.log(`❌ 失败请求: ${stats.failed} (${((stats.failed / stats.total) * 100).toFixed(2)}%)`);
  console.log(`🚀 平均QPS: ${(stats.total / (duration / 1000)).toFixed(2)}`);
  
  if (stats.success > 0) {
    console.log('\n📊 响应时间统计:');
    console.log(`   平均响应时间: ${calculatedStats.avgResponseTime}ms`);
    console.log(`   最小响应时间: ${calculatedStats.minResponseTime}ms`);
    console.log(`   最大响应时间: ${calculatedStats.maxResponseTime}ms`);
    console.log(`   95%响应时间: ${calculatedStats.p95ResponseTime}ms`);
  }
  
  if (Object.keys(stats.errors).length > 0) {
    console.log('\n❌ 错误统计:');
    Object.entries(stats.errors).forEach(([errorType, count]) => {
      console.log(`   ${errorType}: ${count}次`);
    });
  }
  
  console.log('='.repeat(60));
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始API压力测试...');
  console.log(`📋 配置信息:`);
  console.log(`   总请求数: ${TEST_CONFIG.totalRequests}`);
  console.log(`   并发数: ${TEST_CONFIG.concurrency}`);
  console.log(`   超时时间: ${TEST_CONFIG.timeout}ms`);
  console.log(`   目标URL: ${API_CONFIG.url}`);
  console.log('\n' + '-'.repeat(60));
  
  stats.startTime = Date.now();
  
  try {
    // 分批执行请求
    const batches = Math.ceil(TEST_CONFIG.totalRequests / TEST_CONFIG.concurrency);
    
    for (let batch = 0; batch < batches; batch++) {
      const remainingRequests = TEST_CONFIG.totalRequests - (batch * TEST_CONFIG.concurrency);
      const currentBatchSize = Math.min(TEST_CONFIG.concurrency, remainingRequests);
      
      console.log(`\n📦 执行第 ${batch + 1}/${batches} 批次 (${currentBatchSize} 个请求)...`);
      
      await executeBatch(currentBatchSize);
      
      // 批次间短暂延迟，避免过度压力
      if (batch < batches - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
  
  stats.endTime = Date.now();
  printFinalReport();
}

// 处理程序退出
process.on('SIGINT', () => {
  console.log('\n\n⚠️  收到中断信号，正在生成报告...');
  stats.endTime = Date.now();
  printFinalReport();
  process.exit(0);
});

// 启动测试
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 程序执行失败:', error);
    process.exit(1);
  });
}

module.exports = {
  makeRequest,
  executeRequest,
  main
};