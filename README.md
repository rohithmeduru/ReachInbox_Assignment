# Email Onebox - Feature-Rich Email Aggregator

A comprehensive email aggregator system with AI-powered categorization, real-time synchronization, and intelligent reply suggestions. Built with Node.js/TypeScript backend and Next.js frontend.

## Features

### ✅ Implemented Features

1. **Real-Time Email Synchronization**
   - Multiple IMAP account support (minimum 2)
   - Persistent IMAP connections with IDLE mode
   - Last 30 days of email fetching
   - Real-time updates (no cron jobs)

2. **Elasticsearch-Powered Search**
   - Local Elasticsearch instance via Docker
   - Full-text search across subject and body
   - Advanced filtering by account, folder, and category
   - Performance-optimized indexing

3. **AI-Based Email Categorization**
   - 5 categories: Interested, Meeting Booked, Not Interested, Spam, Out of Office
   - OpenAI GPT-4 integration
   - Confidence scoring
   - Batch categorization capabilities

4. **Slack & Webhook Integration**
   - Automatic Slack notifications for "Interested" emails
   - Webhook triggers for external automation
   - Customizable webhook.site integration

5. **Modern Frontend Interface**
   - Email display with search and filtering
   - AI categorization visualization
   - Real-time email updates
   - Responsive design with Tailwind CSS

6. **AI-Powered Reply Suggestions**
   - RAG-based reply generation
   - Multiple suggestion options
   - Confidence scoring
   - Refine suggestions with feedback

## Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL + Elasticsearch
- **AI**: OpenAI GPT-4
- **Email**: IMAP with real-time sync
- **Integrations**: Slack API, Webhooks
- **Container**: Docker

### Frontend
- **Framework**: Next.js 16 with React 19
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Icons**: Heroicons
- **Date Handling**: date-fns

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (or use provided Docker setup)
- OpenAI API Key
- Slack Bot Token (optional)

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd ReachInbox_Assignment

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ..
npm install
```

### 2. Setup Environment Variables

**Backend Environment** (backend/.env):
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=email_onebox
DB_USER=postgres
DB_PASSWORD=password

# Elasticsearch Configuration
ELASTICSEARCH_URL=http://localhost:9200

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key

# Slack Configuration (optional)
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_CHANNEL_ID=general

# Webhook Configuration
WEBHOOK_URL=https://webhook.site/your-unique-id

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Server Configuration
PORT=3001
NODE_ENV=development
```

**Frontend Environment** (.env.local):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 3. Setup Databases

**Option A: Docker (Recommended)**
```bash
cd backend
docker-compose up -d
```

**Option B: Manual Setup**
- Start PostgreSQL on port 5432
- Create database `email_onebox`
- Start Elasticsearch on port 9200
- Run database migration:
```bash
psql -U postgres -d email_onebox -f src/migrations/init.sql
```

### 4. Start the Application

```bash
# Start backend (in backend/ directory)
cd backend
npm run dev

# Start frontend (in root directory)
cd ..
npm run dev
```

### 5. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/api/health

## Adding Email Accounts

### Method 1: Via API
```bash
curl -X POST http://localhost:3001/api/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@gmail.com",
    "name": "Gmail Account",
    "host": "imap.gmail.com",
    "port": 993,
    "secure": true,
    "username": "your-email@gmail.com",
    "password": "your-app-password",
    "syncFolders": ["INBOX", "Sent"]
  }'

# Connect the account
curl -X POST http://localhost:3001/api/accounts/{account-id}/connect
```

### Method 2: Via Frontend (coming soon)
The frontend will include an account management interface for adding and managing email accounts.

## Configuration

### Gmail Setup
1. Enable 2-Factor Authentication
2. Generate an App Password
3. Use App Password instead of regular password

### Outlook Setup
1. Use your regular password
2. For Office 365, use `outlook.office365.com` as host

### Slack Integration (Optional)
1. Create a Slack Bot
2. Get Bot Token (starts with `xoxb-`)
3. Invite bot to channel
4. Set `SLACK_BOT_TOKEN` and `SLACK_CHANNEL_ID`

## API Endpoints

### Emails
- `GET /api/emails` - Search and list emails
- `GET /api/emails/:id` - Get specific email
- `GET /api/emails/stats` - Get email statistics
- `POST /api/emails/:id/reply-suggestion` - Generate AI reply
- `POST /api/emails/:id/categorize` - Manual categorization

### Accounts
- `GET /api/accounts` - List all accounts
- `POST /api/accounts` - Add new account
- `POST /api/accounts/:id/connect` - Connect account
- `POST /api/accounts/:id/disconnect` - Disconnect account

### Health
- `GET /api/health` - Health check

## Development

### Backend Development
```bash
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
```

### Frontend Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
```

### Docker Development
```bash
cd backend
docker-compose up -d    # Start databases
npm run dev             # Start backend with databases
```

## Architecture

### Backend Structure
```
backend/src/
├── config/          # Database, Elasticsearch, IMAP configs
├── services/        # Business logic (IMAP, AI, Slack, etc.)
├── models/          # Data models and types
├── routes/          # API endpoints
├── middleware/      # Express middleware
├── utils/           # Utility functions
└── migrations/      # Database migrations
```

### Frontend Structure
```
src/
├── components/      # React components
├── store/          # Zustand state management
├── types/          # TypeScript type definitions
├── lib/            # Utility functions
└── app/            # Next.js app directory
```

## Performance Considerations

- **Elasticsearch**: Optimized mappings for fast search
- **IMAP**: Connection pooling and reconnection logic
- **AI Processing**: Batch processing to avoid rate limits
- **Frontend**: Optimized for large email lists

## Security Notes

- Passwords are stored in plain text (development only)
- In production, implement password encryption
- Add authentication and authorization
- Use HTTPS in production
- Implement rate limiting

## Troubleshooting

### Common Issues

1. **IMAP Connection Failed**
   - Check credentials
   - Ensure correct host/port settings
   - Verify app password (Gmail)

2. **Elasticsearch Connection Error**
   - Ensure Elasticsearch is running on port 9200
   - Check Docker containers: `docker ps`

3. **AI Categorization Not Working**
   - Verify OpenAI API key
   - Check internet connectivity
   - Review API rate limits

4. **Frontend Not Loading**
   - Check backend is running
   - Verify API URL in environment variables
   - Check browser console for errors

### Logs
```bash
# Backend logs
cd backend && npm run dev

# Docker logs
docker-compose logs -f

# Frontend logs
npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is part of the ReachInbox assignment. Please see the assignment guidelines for usage and submission requirements.

## Support

For questions or issues:
1. Check the troubleshooting section
2. Review the code comments
3. Check API endpoint responses
4. Verify environment variables are set correctly
