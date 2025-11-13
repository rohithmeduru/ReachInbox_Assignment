const express = require('express');
const cors = require('cors');
const { Client } = require('@elastic/elasticsearch');

// Basic test to verify dependencies are working
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Test Elasticsearch connection
async function testElasticsearch() {
  try {
    const esClient = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    });

    const health = await esClient.cluster.health();
    console.log('✅ Elasticsearch connection successful:', health.body.cluster_name);
    return true;
  } catch (error) {
    console.error('❌ Elasticsearch connection failed:', error.message);
    return false;
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Email Onebox API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Test endpoint working',
    dependencies: {
      express: '✅',
      cors: '✅',
      elasticsearch: process.env.ELASTICSEARCH_URL ? '⚠️  Not tested' : '❌ Not configured'
    }
  });
});

async function startServer() {
  console.log('🚀 Starting Email Onebox API server...');

  // Test Elasticsearch if configured
  if (process.env.ELASTICSEARCH_URL) {
    await testElasticsearch();
  }

  app.listen(PORT, () => {
    console.log(`📧 Server running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
  });
}

startServer().catch(console.error);