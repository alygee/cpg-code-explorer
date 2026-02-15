# Docker Setup Instructions

## Prerequisites

1. **Docker** version 20.10 or higher
2. **Docker Compose** version 2.0 or higher
3. **CPG Database** (`data/cpg.db`) - see [SETUP_DB.md](./SETUP_DB.md)

## Docker Installation Check

```bash
# Check Docker version
docker --version

# Check Docker Compose version
docker compose version
```

## Step 1: Database Preparation

Make sure the CPG database is generated and located in the `data/` folder:

```bash
# Check file exists
ls -lh data/cpg.db

# If file doesn't exist, follow instructions in SETUP_DB.md
```

**Important:** The `cpg.db` file should be approximately 900 MB in size. If the file is missing or too small, the application will not start.

## Step 2: Starting the Application

### Option 1: Run in Background (Recommended)

```bash
docker compose up -d
```

### Option 2: Run with Logs

```bash
docker compose up
```

This option is useful for debugging - you'll see all logs in real-time.

## Step 3: Verification

After starting, check:

1. **Container status:**
   ```bash
   docker compose ps
   ```
   
   Both services (`backend` and `frontend`) should be in `Up` status.

2. **Backend health check:**
   ```bash
   curl http://localhost:3001/health
   ```
   
   Should return: `{"status":"ok","timestamp":"..."}`

3. **Open in browser:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001/api/stats

## Container Management

### Stopping

```bash
# Stop containers (preserves data)
docker compose stop

# Stop and remove containers
docker compose down
```

### Restarting

```bash
# Restart all services
docker compose restart

# Restart backend only
docker compose restart backend

# Restart frontend only
docker compose restart frontend
```

### Viewing Logs

```bash
# All logs
docker compose logs -f

# Backend only
docker compose logs -f backend

# Frontend only
docker compose logs -f frontend

# Last 100 lines
docker compose logs --tail=100
```

### Rebuilding Images

If you made code changes:

```bash
# Rebuild and run
docker compose up --build

# Rebuild without cache
docker compose build --no-cache
```

## Troubleshooting

### Issue: Backend Won't Start

**Check:**
1. Presence of `data/cpg.db` file
2. Logs: `docker compose logs backend`
3. Database file permissions

**Solution:**
```bash
# Check logs
docker compose logs backend

# Check database exists
ls -lh data/cpg.db

# If database doesn't exist, generate it (see SETUP_DB.md)
```

### Issue: Frontend Can't Connect to Backend

**Check:**
1. Backend is running: `docker compose ps`
2. Health check works: `curl http://localhost:3001/health`
3. Frontend logs: `docker compose logs frontend`

**Solution:**
```bash
# Restart both services
docker compose restart

# Check environment variables
docker compose config
```

### Issue: Ports Already in Use

If ports 3000 or 3001 are already in use, change them in `docker-compose.yml`:

```yaml
ports:
  - "3002:3001"  # Instead of 3001:3001
```

### Issue: Slow Performance

**Optimization:**
1. Make sure database is on SSD
2. Increase Docker memory (Settings → Resources → Memory)
3. Check that database is not corrupted

## Cleanup

### Remove Containers and Volumes

```bash
# Stop and remove containers, volumes, networks
docker compose down -v
```

### Remove Images

```bash
# Remove project images
docker compose down --rmi all
```

### Full Cleanup (Caution!)

```bash
# Remove all unused Docker resources
docker system prune -a --volumes
```

## Structure in Docker

```
cpg-explorer/
├── backend/              # Built into backend image
│   └── src/              # → /app/src in container
├── frontend/             # Built into frontend image
│   └── src/              # → /app/src in container
├── data/                 # Mounted as volume
│   └── cpg.db            # → /app/data/cpg.db (read-only)
└── docker-compose.yml    # Configuration
```

## Environment Variables

### Backend

- `PORT` - Server port (default: 3001)
- `DB_PATH` - Database path (default: /app/data/cpg.db)

### Frontend

- `VITE_API_URL` - Backend API URL (set at build time)

## Production Deployment

For production, it's recommended to:

1. Use `.env` file for configuration
2. Set up reverse proxy (nginx)
3. Use HTTPS
4. Configure monitoring and logging

Example `.env`:
```env
PORT=3001
DB_PATH=/app/data/cpg.db
VITE_API_URL=https://api.example.com/api
```
