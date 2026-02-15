# Инструкция по запуску в Docker

## Предварительные требования

1. **Docker** версии 20.10 или выше
2. **Docker Compose** версии 2.0 или выше
3. **База данных CPG** (`data/cpg.db`) - см. [SETUP_DB.md](./SETUP_DB.md)

## Проверка установки Docker

```bash
# Проверка версии Docker
docker --version

# Проверка версии Docker Compose
docker compose version
```

## Шаг 1: Подготовка базы данных

Убедитесь, что база данных CPG сгенерирована и находится в папке `data/`:

```bash
# Проверка наличия файла
ls -lh data/cpg.db

# Если файла нет, следуйте инструкциям в SETUP_DB.md
```

**Важно:** Файл `cpg.db` должен быть размером примерно 900 MB. Если файл отсутствует или слишком маленький, приложение не запустится.

## Шаг 2: Запуск приложения

### Вариант 1: Запуск в фоновом режиме (рекомендуется)

```bash
docker compose up -d
```

### Вариант 2: Запуск с выводом логов

```bash
docker compose up
```

Этот вариант полезен для отладки - вы увидите все логи в реальном времени.

## Шаг 3: Проверка работы

После запуска проверьте:

1. **Статус контейнеров:**
   ```bash
   docker compose ps
   ```
   
   Оба сервиса (`backend` и `frontend`) должны быть в статусе `Up`.

2. **Health check backend:**
   ```bash
   curl http://localhost:3001/health
   ```
   
   Должен вернуть: `{"status":"ok","timestamp":"..."}`

3. **Откройте в браузере:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001/api/stats

## Управление контейнерами

### Остановка

```bash
# Остановить контейнеры (сохраняет данные)
docker compose stop

# Остановить и удалить контейнеры
docker compose down
```

### Перезапуск

```bash
# Перезапустить все сервисы
docker compose restart

# Перезапустить только backend
docker compose restart backend

# Перезапустить только frontend
docker compose restart frontend
```

### Просмотр логов

```bash
# Все логи
docker compose logs -f

# Только backend
docker compose logs -f backend

# Только frontend
docker compose logs -f frontend

# Последние 100 строк
docker compose logs --tail=100
```

### Пересборка образов

Если вы внесли изменения в код:

```bash
# Пересобрать и запустить
docker compose up --build

# Пересобрать без кэша
docker compose build --no-cache
```

## Решение проблем

### Проблема: Backend не запускается

**Проверьте:**
1. Наличие файла `data/cpg.db`
2. Логи: `docker compose logs backend`
3. Права доступа к файлу базы данных

**Решение:**
```bash
# Проверить логи
docker compose logs backend

# Проверить наличие базы
ls -lh data/cpg.db

# Если базы нет, сгенерируйте её (см. SETUP_DB.md)
```

### Проблема: Frontend не подключается к backend

**Проверьте:**
1. Backend запущен: `docker compose ps`
2. Health check работает: `curl http://localhost:3001/health`
3. Логи frontend: `docker compose logs frontend`

**Решение:**
```bash
# Перезапустить оба сервиса
docker compose restart

# Проверить переменные окружения
docker compose config
```

### Проблема: Порты заняты

Если порты 3000 или 3001 уже заняты, измените их в `docker-compose.yml`:

```yaml
ports:
  - "3002:3001"  # Вместо 3001:3001
```

### Проблема: Медленная работа

**Оптимизация:**
1. Убедитесь, что база данных на SSD
2. Увеличьте память для Docker (Settings → Resources → Memory)
3. Проверьте, что база данных не повреждена

## Очистка

### Удалить контейнеры и volumes

```bash
# Остановить и удалить контейнеры, volumes, сети
docker compose down -v
```

### Удалить образы

```bash
# Удалить образы проекта
docker compose down --rmi all
```

### Полная очистка (осторожно!)

```bash
# Удалить все неиспользуемые ресурсы Docker
docker system prune -a --volumes
```

## Структура в Docker

```
cpg-explorer/
├── backend/              # Собирается в образ backend
│   └── src/              # → /app/src в контейнере
├── frontend/             # Собирается в образ frontend
│   └── src/              # → /app/src в контейнере
├── data/                 # Монтируется как volume
│   └── cpg.db            # → /app/data/cpg.db (read-only)
└── docker-compose.yml    # Конфигурация
```

## Переменные окружения

### Backend

- `PORT` - Порт сервера (по умолчанию: 3001)
- `DB_PATH` - Путь к базе данных (по умолчанию: /app/data/cpg.db)

### Frontend

- `VITE_API_URL` - URL API бэкенда (устанавливается при сборке)

## Производственное развёртывание

Для production рекомендуется:

1. Использовать `.env` файл для конфигурации
2. Настроить reverse proxy (nginx)
3. Использовать HTTPS
4. Настроить мониторинг и логирование

Пример `.env`:
```env
PORT=3001
DB_PATH=/app/data/cpg.db
VITE_API_URL=https://api.example.com/api
```

