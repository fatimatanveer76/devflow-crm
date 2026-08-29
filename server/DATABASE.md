# DevFlow CRM — Database & Sequelize Documentation

## 1. Overview & Architecture

DevFlow CRM uses **PostgreSQL** as its relational database management system, managed via **Sequelize ORM** and **Sequelize CLI**.

### Key Architectural Characteristics
- **Singleton Connection**: A single centralized Sequelize instance manages connection pooling and query lifecycles.
- **Connection Pooling**: Configured with explicit `max`, `min`, `acquire`, and `idle` timeout parameters.
- **Environment Isolation**: Separate configurations for `development`, `test`, and `production`.
- **Reversible Migrations**: All schema modifications utilize version-controlled `up` and `down` migration scripts.
- **ESM Application & CJS CLI Interoperability**: Application runtime utilizes ECMAScript Modules (ESM), while CLI migrations are executed via `server/.sequelizerc` and `src/config/database.cjs`.

---

## 2. PostgreSQL Installation & Setup

### Prerequisites
PostgreSQL 14+ is recommended.

#### Windows
1. Download installer from [PostgreSQL Official Website](https://www.postgresql.org/download/windows/).
2. Complete installation with default port `5432`.
3. Verify installation in PowerShell:
   ```powershell
   psql -U postgres
   ```

#### macOS (via Homebrew)
```bash
brew install postgresql@16
brew services start postgresql@16
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Docker Alternative (Development)
```bash
docker run --name devflow-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=devflow_db -p 5432:5432 -d postgres:16-alpine
```

---

## 3. Database Initialization

Create the development database (`devflow_db`):

```sql
CREATE DATABASE devflow_db;
CREATE DATABASE devflow_db_test;
```

Or via CLI:
```bash
createdb -U postgres devflow_db
createdb -U postgres devflow_db_test
```

---

## 4. Environment Configuration

Configure `server/.env` with your local PostgreSQL credentials:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database Configuration (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=devflow_db
DB_USER=postgres
DB_PASSWORD=your_secure_password_here
DB_DIALECT=postgres
DB_LOGGING=false

# Connection Pooling
DB_POOL_MAX=10
DB_POOL_MIN=0
DB_POOL_ACQUIRE=30000
DB_POOL_IDLE=10000
DB_SSL=false
```

> **Security Rule**: Never commit `.env` to Git. Always maintain safe placeholder values in `.env.example`.

---

## 5. Migration Workflow

Migrations are stored in `server/src/database/migrations/`.

### Run Pending Migrations
```bash
# From server directory
npm run db:migrate

# Or from workspace root
npm run db:migrate
```

### Undo Last Migration
```bash
npm run db:migrate:undo
```

### Revert All Migrations
```bash
npm run db:migrate:undo:all
```

---

## 6. Seeder Workflow

Seeders are stored in `server/src/database/seeders/`.

### Run All Seeders
```bash
npm run db:seed
```

### Undo All Seeders
```bash
npm run db:seed:undo
```

---

## 7. Development Database Reset

To completely reset the development schema and re-run all migrations and seeders:

```bash
npm run db:reset
```

> **Safety Notice**: `db:reset` contains a safety guard preventing execution when `NODE_ENV=production`.

---

## 8. Database Health Check

Check database connectivity and system status via HTTP GET:

```http
GET http://localhost:5000/api/v1/health
```

### Healthy Response (Connected)
```json
{
  "success": true,
  "data": {
    "server": {
      "status": "healthy",
      "uptime": "42s",
      "environment": "development",
      "timestamp": "2026-08-29T15:45:00.000Z"
    },
    "database": {
      "status": "connected",
      "dialect": "postgres",
      "database": "devflow_db"
    }
  }
}
```

### Degraded Response (Database Unreachable)
```json
{
  "success": true,
  "data": {
    "server": {
      "status": "healthy",
      "uptime": "42s",
      "environment": "development",
      "timestamp": "2026-08-29T15:45:00.000Z"
    },
    "database": {
      "status": "disconnected",
      "dialect": "postgres",
      "database": "devflow_db",
      "message": "Database currently unreachable"
    }
  }
}
```

---

## 9. Base Model Architectural Conventions

All entity models implemented in future phases MUST follow these established standards:

### 1. Primary Keys
- **UUIDv4**: Standard for all primary entities (`DataTypes.UUID`, default `UUIDV4`).
- Benefit: Prevents ID enumeration attacks and facilitates distributed ID generation.

### 2. Timestamps & Naming Conventions
- **Timestamps**: `timestamps: true` (creates `createdAt` and `updatedAt`).
- **Underscored**: `underscored: true` (maps camelCase model attributes to `snake_case` database column names: `created_at`, `updated_at`, `deleted_at`).
- **Explicit Table Names**: Always declare explicit snake_case plural table names (e.g. `tableName: 'users'`).

### 3. Soft Deletes (Paranoid)
- All critical business records (Users, Leads, Deals, Projects, Invoices, Milestones) must enable soft-delete:
  `paranoid: true`, `deletedAt: 'deleted_at'` or `'archived_at'`.

### 4. Reusable Helper Import
```javascript
import { DataTypes, Model } from 'sequelize';
import { uuidPrimaryKey, createModelOptions } from './baseModel.js';

export class ExampleModel extends Model {}

export const initExampleModel = (sequelize) => {
  ExampleModel.init(
    {
      id: uuidPrimaryKey,
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
    },
    {
      sequelize,
      ...createModelOptions({ tableName: 'examples', paranoid: true }),
    }
  );
  return ExampleModel;
};
```
