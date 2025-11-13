# ReachInbox Email Onebox System

A comprehensive email onebox solution with real-time synchronization, AI-powered categorization, and intelligent reply suggestions.

## 🚀 Deployment Options

### 1. **Quick Deploy with Vercel (Recommended)**
```bash
# Deploy frontend to Vercel
npm install -g vercel
cd /workspace/cmhxcqi3p009ko6ikddtxla0m/ReachInbox_Assignment
vercel --prod

# Deploy backend to Vercel Serverless
vercel backend --prod
```

### 2. **Docker Deployment**
```bash
# Build and run with Docker
docker-compose up -d
```

### 3. **Manual Cloud Deployment**
- **Frontend**: Deploy to Vercel, Netlify, or AWS S3
- **Backend**: Deploy to Heroku, AWS EC2, or DigitalOcean

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 13+
- Elasticsearch 8.x
- OpenAI API key
- Slack Bot Token (optional)

## 🔧 Environment Setup

### Frontend Environment (.env.local)
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
```

### Backend Environment (.env)
```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/email_onebox

# Services
ELASTICSEARCH_URL=http://localhost:9200
OPENAI_API_KEY=your_openai_api_key

# Integrations
SLACK_BOT_TOKEN=xoxb-your-slack-token
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK

# Production
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend-url.com
```

## 🏗️ Architecture

- **Frontend**: Next.js 16, React 19, TypeScript
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL
- **Search**: Elasticsearch
- **AI**: OpenAI GPT-4
- **Real-time**: IMAP IDLE mode

## 📱 Features

- ✅ Real-time email synchronization
- ✅ AI-powered categorization (5 categories)
- ✅ Smart reply suggestions with RAG
- ✅ Elasticsearch-powered search
- ✅ Slack & webhook notifications
- ✅ Multi-account support
- ✅ Attachment handling

## 🔍 Live Demo

[Your Deployment Link Here]

After deployment, your application will be available at the provided URL with full email onebox functionality.