# Hackathon Backend Nest-js

A NestJS API for managing hackathons, participants, and user access.

## Technologies

- NestJS and TypeScript
- PostgreSQL with Prisma ORM 7
- Better Auth
- Swagger / OpenAPI

## Key Features

- Admin-managed Hackathon creation, updates, and deletion
- Authenticated Hackathon listing and detail lookup
- Participant join/leave operations with duplicate and capacity protection
- Search by name, active-state and status filters, and pagination
- Dynamic upcoming, ongoing, and completed status
- Participant counts and optional maximum participant limits
- DTO validation and standardized `{ statusCode, message, data }` responses
- Swagger API documentation

## Project Structure

```text
src/
├── common/
│   ├── decorators/       # Shared response decorators
│   ├── dtos/              # Shared API response schemas
│   ├── interceptors/      # Global response formatting
│   └── pipes/             # Global request validation
├── module/
│   ├── hackathon/
│   │   ├── dto/           # Hackathon create, update, and query DTOs
│   │   ├── hackathon.controller.ts
│   │   ├── hackathon.service.ts
│   │   └── hackathon.module.ts
│   └── users/
│       ├── users.controller.ts
│       ├── users.service.ts
│       └── users.module.ts
├── app.module.ts
├── auth.ts                # Better Auth configuration
├── main.ts                # Application bootstrap and Swagger setup
├── prisma.module.ts
└── prisma.service.ts
prisma/
├── migrations/
└── schema.prisma
```

## Authentication and Authorization

Better Auth provides email/password authentication and session cookies. Authenticated users can read hackathon information. Admins can create, update, and delete hackathons; participants can join and leave them.

## Database

The project uses PostgreSQL with Prisma ORM 7. Hackathon, user, and participation data are defined in `prisma/schema.prisma`.

## Installation and Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file with the required configuration:

   ```env
   DATABASE_URL="your-postgresql-connection-string"
   BETTER_AUTH_SECRET="your-better-auth-secret"
   BETTER_AUTH_URL="http://localhost:3000"
   ```

3. Apply database migrations and generate Prisma Client:

   ```bash
   npm run db:migrate
   npm run db:generate
   ```

## Run the Project

Start the development server:

```bash
npm run start:dev
```

Swagger API documentation is available at [http://localhost:3000/api/docs](http://localhost:3000/api/docs).