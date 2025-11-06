# Vistora - SaaS Task Management Platform
[Watch-here-when-I-again-set-the-Stack](http://production-alb-1858392579.us-east-1.elb.amazonaws.com/login)
A modern, cloud-native task management platform with real-time collaboration features, built with React, Node.js, and deployed on AWS.

## Features

- User authentication with JWT
- Real-time task updates via WebSocket
- Task creation, editing, and deletion
- Task filtering by status, priority, and assignee
- Responsive UI with Material-UI
- RESTful API
- Containerized with Docker
- Infrastructure as Code with CloudFormation
- CI/CD pipeline ready
- Comprehensive monitoring and logging

## Technology Stack

### Frontend
- React 18 with TypeScript
- Material-UI components
- Socket.io-client for real-time updates
- Axios for HTTP requests
- React Router for navigation
- Vite for build tooling

### Backend
- Node.js 18 with Express
- TypeScript
- PostgreSQL with Sequelize ORM
- Redis for caching and pub/sub
- Socket.io for WebSocket
- JWT authentication
- Winston for logging

### Infrastructure
- AWS ECS Fargate for container orchestration
- AWS RDS PostgreSQL for database
- AWS ElastiCache Redis for caching
- AWS Application Load Balancer
- AWS CloudFormation for IaC
- AWS CloudWatch for monitoring
- Docker for containerization

## Project Structure

```
Vistora/
├── backend/                 # Backend API
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── services/       # Business logic
│   │   ├── websocket/      # Socket.io handlers
│   │   ├── config/         # Configuration
│   │   ├── utils/          # Helper functions
│   │   └── __tests__/      # Unit tests
│   ├── Dockerfile
│   └── package.json
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript types
│   │   └── test/           # Unit tests
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── infrastructure/          # Infrastructure as Code
│   ├── cloudformation/     # AWS CloudFormation templates
│   │   ├── main-stack.yaml
│   │   ├── network-stack.yaml
│   │   ├── security-stack.yaml
│   │   ├── database-stack.yaml
│   │   ├── cache-stack.yaml
│   │   ├── compute-stack.yaml
│   │   └── monitoring-stack.yaml
│   ├── terraform/          # Terraform configurations
│   │   ├── modules/
│   │   │   ├── vpc/       # VPC networking module
│   │   │   ├── eks/       # EKS cluster module
│   │   │   ├── rds/       # RDS PostgreSQL module
│   │   │   └── elasticache/ # ElastiCache Redis module
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   ├── modules.tf
│   │   ├── terraform.tfvars.example
│   │   └── README.md
│   └── kubernetes/         # Kubernetes manifests
│       ├── namespaces/     # Namespace definitions
│       ├── secrets/        # Secrets management
│       ├── configmaps/     # Configuration maps
│       ├── rbac/           # RBAC policies
│       ├── storage/        # StorageClass definitions
│       ├── statefulsets/   # StatefulSets (PostgreSQL, Redis)
│       ├── deployments/    # Application deployments
│       ├── services/       # Service definitions
│       ├── ingress/        # Ingress configuration
│       ├── hpa/            # HorizontalPodAutoscaler
│       ├── networkpolicies/ # Network policies
│       └── README.md
├── scripts/                 # Deployment and automation scripts
│   ├── deploy-stack.ps1
│   ├── deploy-with-logging.ps1
│   ├── cleanup-stacks.ps1
│   ├── run-migrations.py
│   ├── terraform-deploy.sh
│   ├── k8s-deploy.sh
│   └── terraform-destroy.sh
├── .github/
│   └── workflows/          # GitHub Actions CI/CD
│       ├── deploy.yml
│       └── upload-templates.yml
├── docker-compose.yml       # Local development
├── DEPLOYMENT.md            # Deployment guide
├── DEPLOYMENT_AUTOMATION.md # Automation documentation
└── README.md
```

## Quick Start

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/akshatsinha0/Vistora.git
cd Vistora
```

2. Start services with Docker Compose:
```bash
docker-compose up -d
```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - Health Check: http://localhost:8080/health

### AWS Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Task Endpoints

- `GET /api/tasks` - List tasks (with optional filters)
- `POST /api/tasks` - Create task
- `GET /api/tasks/:id` - Get task by ID
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### WebSocket Events

- `task:created` - Emitted when a task is created
- `task:updated` - Emitted when a task is updated
- `task:deleted` - Emitted when a task is deleted

## Development

### Backend Development

```bash
cd backend
npm install
npm run dev
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

### Running Tests

Backend tests:
```bash
cd backend
npm test
```

Frontend tests:
```bash
cd frontend
npm test
```

## Environment Variables

### Backend

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 8080)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing key
- `JWT_EXPIRES_IN` - JWT expiration time

### Frontend

- `VITE_API_URL` - Backend API URL
- `VITE_WS_URL` - WebSocket server URL

## Architecture

The application follows a microservices architecture with:

- **Frontend**: React SPA served by nginx
- **Backend**: Node.js API with Express
- **Database**: PostgreSQL for persistent storage
- **Cache**: Redis for session storage and pub/sub
- **Load Balancer**: AWS ALB for traffic distribution
- **Container Orchestration**: AWS ECS Fargate

## Monitoring

- CloudWatch metrics for CPU, memory, and request metrics
- CloudWatch Logs for application logs
- CloudWatch Alarms for error rates and performance
- SNS notifications for critical alerts

## Security

- JWT-based authentication
- Password hashing with bcrypt
- Secrets stored in AWS Secrets Manager
- Security groups for network isolation
- Encryption at rest for RDS
- Encryption in transit with TLS

## License

MIT License

## Support

For issues or questions, please open an issue on GitHub.
