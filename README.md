# GameLog Analyzer

GameLog Analyzer is a backend service that processes game log files to extract match data and player statistics. It provides RESTful APIs to upload game logs, retrieve match information, and generate player rankings. The application uses a clean architecture approach with domain entities, repositories, and services.


## ✨ Features

- **Game Log Processing**: Upload and parse game log files (.log, .txt formats)
- **Match Management**: Store and retrieve match data
- **Player Statistics**: Track kills, deaths, kill streaks, and weapon usage per player
- **Ranking System**: Generate global player rankings and match-specific rankings
- **Testing**: Unit and end-to-end test suites

## 📁 Project Structure

```
gamelog-analyzer/
├── game-logs-examples/        # Sample game log files for testing
├── src/
│   ├── app/                    # Application layer
│   │   ├── entities/          # Domain entities (Match, PlayerStats)
│   │   ├── repositories/      # Repository interfaces
│   │   ├── services/          # Business logic services
│   │   └── types/             # Type definitions
│   ├── config/                # Configuration files
│   └── infra/                 # Infrastructure layer
│       ├── database/          # Database configuration and implementations
│       │   └── prisma/        # Prisma-specific implementations
│       └── http/              # HTTP controllers and modules
├── prisma/                    # Database schema and migrations
├── test/                      # End-to-end tests
├── docker-compose.yml         # Docker Compose configuration
├── Dockerfile                 # Docker container definition
```

### 🗄️ Database Schema
<img src="ERD.svg" alt="Entity Relationship Diagram" height="500">

## ⚙️ Installation & Setup

### 📋 Prerequisites

- Node.js 18+ 
- npm

### 🔧 Manual Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Gust4voSales/gamelog-analyzer.git
   cd gamelog-analyzer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file like (`.env.example`) in the root directory:
   ```bash
   NODE_ENV=development
   PORT=3333
   DATABASE_URL=file:./dev.db
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate deploy
   ```

5. **Start the application**
   ```bash
   # Development mode with hot reload
   npm run start:dev
   
   # Production mode
   npm run start:prod
   ```

The application will be available at `http://localhost:3333`

### 🐳 Docker Setup

The easiest way to build an run the application is using Docker Compose:

1. **Create environment file**
   
   Create a `.env` file:
   ```bash
   NODE_ENV=production
   PORT=3333
   DATABASE_URL=file:/app/data/prod.db
   ```

2. **Run with Docker Compose**
   ```bash
   docker compose up
   ```

This will build the Docker image, set up the database, run migrations, and start the application automatically.

## 🌐 API Endpoints

The application provides the following REST endpoints:

### Game Logs
- `POST /game-logs/upload` - Upload and process game log files
  - **Content-Type**: `multipart/form-data` (add to Headers)
  - **Form field**: `file` (the log file to upload)
  - **Accepted formats**: `.log` and `.txt` files only
  - **Sample files**: Available in `game-logs-examples/` directory
  
### Matches
- `GET /matches` - List all matches with basic information
- `GET /matches/:id/ranking` - Get player ranking for a specific match
- `DELETE /matches` - Delete all matches (⚠️ Dangerous - use it to speed debugging testing, cleaning the db)

### Players
- `GET /players/ranking` - Get global player ranking across all matches

## 🧪 API Testing with Insomnia

An Insomnia REST client collection is provided for easy API testing:

- **File**: `Insomnia_2025-08-15.yaml`
- **Import**: Open Insomnia → Import → Select the YAML file
- **Base URL**: Configure the environment variable `baseURL` to `http://localhost:3333`

## 📝 Sample Game Logs

The `game-logs-examples/` directory contains sample game log files for testing:

- **`test-1-match.log`** - Single match with player kills and deaths
- **`test-3-matches.log`** - Multiple matches across different dates

### Log Format
Game logs follow this format:
```
DD/MM/YYYY HH:mm:ss - New match [MATCH_ID] has started
DD/MM/YYYY HH:mm:ss - [PLAYER] killed [PLAYER] using [WEAPON]
DD/MM/YYYY HH:mm:ss - <WORLD> killed [PLAYER] by [CAUSE]
DD/MM/YYYY HH:mm:ss - Match [MATCH_ID] has ended
```

Use these files to quickly test the upload functionality and see how the system processes game data.

## 🧪 Testing

The project includes comprehensive test suites:

### 🔬 Unit Tests
```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e
```

### 🗃️ Database Management
```bash
# View database in Prisma Studio
npx prisma studio
```
