# 🚀 Deployment Guide - ReachInbox Email Onebox

## Quick Deployment Options

### 1. **Vercel Deployment (Recommended - Free)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy Frontend
cd /workspace/cmhxcqi3p009ko6ikddtxla0m/ReachInbox_Assignment
vercel --prod

# Deploy Backend (separately)
cd backend
vercel --prod
```

**Required Environment Variables on Vercel:**
- `OPENAI_API_KEY`: Your OpenAI API key
- `DATABASE_URL`: PostgreSQL connection string
- `ELASTICSEARCH_URL`: Elasticsearch URL
- `SLACK_BOT_TOKEN`: Slack bot token (optional)

### 2. **Docker Production Deployment**
```bash
# Create production environment file
cp .env.example .env
# Edit .env with your production values

# Deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Access your app at http://localhost
```

### 3. **Manual Cloud Deployment**

#### **Heroku Deployment**
```bash
# Install Heroku CLI
# Create apps
heroku create your-app-frontend
heroku create your-app-backend

# Set environment variables
heroku config:set OPENAI_API_KEY=your_key
heroku config:set DATABASE_URL=your_db_url
heroku config:set NODE_ENV=production

# Deploy backend
cd backend
git subtree push --prefix backend heroku main

# Deploy frontend
cd ..
git subtree push --prefix frontend heroku main
```

#### **AWS EC2 Deployment**
```bash
# On EC2 instance
sudo apt update
sudo apt install docker docker-compose -y

# Clone repository
git clone <your-repo-url>
cd ReachInbox_Assignment

# Set environment variables
cp .env.example .env
# Edit .env

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

## 📋 Prerequisites

### Required Services
1. **PostgreSQL Database** (13+)
   - Create database: `email_onebox`
   - User with full privileges

2. **Elasticsearch** (8.x)
   - Single-node cluster sufficient for small scale
   - Configure index mapping automatically

3. **OpenAI API**
   - Get API key from https://platform.openai.com
   - Required for AI categorization and reply generation

### Optional Services
1. **Slack Workspace**
   - Bot token for notifications
   - Webhook URL for email alerts

2. **Redis** (for caching)
   - Improves performance for frequent queries

## 🔧 Environment Configuration

### Production Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/email_onebox

# AI Services
OPENAI_API_KEY=sk-proj-xxxxx

# Search Service
ELASTICSEARCH_URL=http://elasticsearch:9200

# Slack Integration
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz

# Application
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend-domain.com

# Webhooks
WEBHOOK_SECRET=your-random-secret
```

## 🏗️ Production Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Services      │
│   (Next.js)     │◄──►│   (Express)     │◄──►│ PostgreSQL      │
│   Port: 3000    │    │   Port: 3001    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  Elasticsearch  │
                       │    Port: 9200   │
                       └─────────────────┘
```

## 🔒 Security Considerations

1. **Environment Variables**: Never commit secrets to git
2. **Database**: Use SSL connections in production
3. **API Keys**: Rotate OpenAI keys regularly
4. **HTTPS**: Use SSL certificates (free via Let's Encrypt)
5. **Firewall**: Only expose necessary ports
6. **Monitoring**: Set up logs and alerts

## 📊 Monitoring & Scaling

### Health Checks
- Frontend: `GET /`
- Backend: `GET /api/health`
- Database: Connection health endpoint
- Elasticsearch: Cluster health API

### Scaling Options
1. **Horizontal Scaling**: Load balancer + multiple instances
2. **Database Scaling**: Read replicas for heavy read workloads
3. **Search Scaling**: Elasticsearch cluster with multiple nodes

### Monitoring Tools
- **Free**: Uptime Robot, Pingdom
- **Paid**: DataDog, New Relic
- **Self-hosted**: Prometheus + Grafana

## 🚨 Troubleshooting

### Common Issues
1. **Elasticsearch Connection Failed**
   - Check if Elasticsearch is running: `curl http://localhost:9200`
   - Verify network connectivity

2. **Database Connection Errors**
   - Test connection: `psql $DATABASE_URL`
   - Check credentials and network access

3. **OpenAI API Errors**
   - Verify API key is valid and has credits
   - Check rate limits and quotas

4. **Frontend Not Loading**
   - Check API URL in environment variables
   - Verify CORS configuration

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 📈 Cost Optimization

### Free Tier Usage
- **Vercel**: 100GB bandwidth/month (sufficient for small apps)
- **Heroku**: Eco dyno (limited hours)
- **Supabase**: Free PostgreSQL tier
- **Elastic Cloud**: Free tier available

### Optimization Tips
1. **Caching**: Use Redis for frequently accessed data
2. **Database**: Implement proper indexing
3. **CDN**: Use Cloudflare for static assets
4. **Compression**: Enable gzip on API responses

---

## 🎉 Deployment Complete!

Once deployed, your ReachInbox Email Onebox will be available at your chosen domain with:

- ✅ Real-time email synchronization
- ✅ AI-powered email categorization
- ✅ Intelligent reply suggestions
- ✅ Advanced search capabilities
- ✅ Slack and webhook integrations
- ✅ Multi-account support

**Live Demo URL**: [Your deployment link will appear here]