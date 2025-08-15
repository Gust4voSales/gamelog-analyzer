## Description

GameLog Analyzer - A NestJS application for analyzing game logs and player statistics. Built with Prisma ORM and SQLite database.

## Project setup

### Local Development

```bash
# Install dependencies
$ npm install

# Set up environment variables
$ cp env.example .env

# Generate Prisma client
$ npx prisma generate

# Run database migrations
$ npx prisma migrate deploy
```

### Docker Setup

```bash
# Build and run with docker-compose
$ docker-compose up
```

### Local Development

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

```

### Environment Variables

Create a `.env` file based on `env.example`:

- `NODE_ENV`: Application environment (development/production)
- `PORT`: Server port
- `DATABASE_URL`: Database connection string
