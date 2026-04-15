# TaskFlow — Project Management App

A two-tier task management application built with AngularJS and Java 8, deployed on AWS with Docker.


## Tech Stack

| Layer          | Technologies                                      |
|----------------|---------------------------------------------------|
| Frontend       | AngularJS 1.8, TypeScript, Webpack, Nginx          |
| Backend        | Java 8, Spring Boot 2.7, Spring Data JPA, H2       |
| Infrastructure | Docker, ECS Fargate, CloudFront, ALB, Terraform    |

## Project Structure

```
├── frontend/                # AngularJS + TypeScript SPA
│   ├── src/                 # TypeScript source (controllers, services, models)
│   ├── views/               # HTML templates (dashboard, board, list, detail, form)
│   ├── css/                 # Styles
│   ├── Dockerfile           # Multi-stage: Node build → Nginx
│   └── nginx.conf           # Reverse proxy config (BACKEND_HOST env var)
├── backend/                 # Java 8 Spring Boot API
│   ├── src/main/java/com/taskmanager/
│   │   ├── domain/          # Model, repository, exceptions│   │   ├── application/     # Service layer, DTOs
│   │   └── infrastructure/  # Controllers, exception handler, seed data
│   └── Dockerfile           # Multi-stage: Maven build → JRE 8
├── infrastructure/          # Terraform (ECR, ECS, ALB, CloudFront, Route53)
└── docker-compose.yml       # Local development
```

## API Endpoints

```
GET    /api/tasks              List all (optional: ?status=, ?priority=, ?assignee=)
GET    /api/tasks/:id          Get by ID
POST   /api/tasks              Create
PUT    /api/tasks/:id          Update
PATCH  /api/tasks/:id/status   Update status only
DELETE /api/tasks/:id          Delete
```

## Local Development

```bash
docker compose up --build
```

Frontend: http://localhost:3000
Backend API: http://localhost:8080/api/tasks

## Deploy to AWS

```bash
cd infrastructure
./push-images.sh                # Build + push to ECR
terraform apply                 # Provision infrastructure
aws ecs update-service \        # Force new deployment
  --cluster legacy-app-cluster \
  --service legacy-app-service \
  --force-new-deployment
```
