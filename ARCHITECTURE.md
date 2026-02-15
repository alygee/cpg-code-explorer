# Архитектура проекта CPG Code Explorer

## Обзор проекта

**CPG Code Explorer** — веб-приложение для исследования Go-кодовой базы через Code Property Graph (CPG). Проект реализует два основных режима работы:
1. **Call Graph Explorer** — визуализация графа вызовов функций
2. **Data Flow Slicer** — анализ потока данных через переменные

### Масштаб данных
- База данных: ~900 MB SQLite
- Узлы: ~555,000
- Рёбра: ~1,500,000
- Пакеты: ~170
- Файлы: тысячи

---

## Архитектура системы

### Общая схема

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  App.tsx │  │ Components│  │  Hooks   │             │
│  │  (State) │  │  (UI)     │  │  (Logic) │             │
│  └────┬─────┘  └────┬──────┘  └────┬─────┘             │
│       │             │              │                    │
│       └─────────────┴──────────────┘                    │
│                    │                                     │
│              TanStack Query                              │
│              (Caching Layer)                             │
└────────────────────┼─────────────────────────────────────┘
                     │ HTTP REST API
┌────────────────────┼─────────────────────────────────────┐
│              Backend (Express)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Routes  │  │    DB     │  │  Types   │             │
│  │  (API)   │  │  (Layer)  │  │          │             │
│  └────┬─────┘  └────┬──────┘  └──────────┘             │
│       │             │                                    │
│       └─────────────┘                                    │
└────────────────────┼─────────────────────────────────────┘
                     │
┌────────────────────┼─────────────────────────────────────┐
│            SQLite Database (Read-Only)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Nodes   │  │  Edges   │  │  Views   │             │
│  │  Tables  │  │  Tables  │  │  Queries │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└───────────────────────────────────────────────────────────┘
```

---

## Структура проекта

```
cpg-explorer/
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── index.ts           # Точка входа, настройка Express
│   │   ├── db.ts              # Слой работы с БД (singleton)
│   │   ├── types.ts           # TypeScript типы для backend
│   │   └── routes/            # API маршруты (модульная структура)
│   │       ├── functions.ts   # Поиск и детали функций
│   │       ├── graph.ts       # Call graph операции
│   │       ├── dataflow.ts    # Data flow slice операции
│   │       ├── packages.ts    # Работа с пакетами
│   │       ├── sources.ts     # Исходный код
│   │       └── stats.ts        # Статистика
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                   # React + TypeScript SPA
│   ├── src/
│   │   ├── App.tsx            # Главный компонент, управление состоянием
│   │   ├── main.tsx           # Точка входа React
│   │   ├── types.ts           # TypeScript типы для frontend
│   │   ├── api/
│   │   │   └── client.ts      # Axios HTTP клиент
│   │   ├── components/        # React компоненты
│   │   │   ├── SearchBar.tsx      # Поиск функций
│   │   │   ├── Sidebar.tsx         # Навигация по пакетам
│   │   │   ├── GraphView.tsx       # Визуализация графа (React Flow)
│   │   │   ├── SourcePanel.tsx    # Просмотр исходного кода
│   │   │   ├── FunctionDetails.tsx # Метрики функции
│   │   │   └── DataFlowPanel.tsx  # Панель выбора переменных
│   │   └── hooks/             # Custom React hooks
│   │       ├── useApi.ts      # Hooks для API запросов (TanStack Query)
│   │       └── useGraph.ts    # Логика работы с графом
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts         # Конфигурация Vite
│   └── tailwind.config.js    # Конфигурация Tailwind CSS
│
├── data/                       # База данных CPG
│   └── cpg.db                  # SQLite файл (~900 MB)
│
├── docker-compose.yml          # Оркестрация сервисов
├── README.md                   # Основная документация
├── DOCKER.md                   # Инструкции по Docker
└── SETUP_DB.md                 # Инструкции по генерации БД
```

---

## Технологический стек

### Frontend
- **React 18** — UI библиотека
- **TypeScript** — типизация
- **Vite** — сборщик и dev-сервер
- **@xyflow/react (React Flow v12)** — визуализация графов
- **dagre** — алгоритм layout для графов
- **TanStack Query (React Query)** — управление состоянием и кэширование API
- **Axios** — HTTP клиент
- **Tailwind CSS** — utility-first CSS
- **Prism.js** — подсветка синтаксиса Go
- **react-simple-code-editor** — редактор кода

### Backend
- **Node.js 20** — runtime
- **Express** — веб-фреймворк
- **TypeScript** — типизация
- **better-sqlite3** — синхронный SQLite драйвер
- **CORS** — разрешение cross-origin запросов

### Инфраструктура
- **Docker** — контейнеризация
- **Docker Compose** — оркестрация
- **SQLite** — база данных (read-only)

---

## Архитектурные решения

### 1. Модульная структура Backend

**Проблема**: Монолитный файл с роутами сложно поддерживать.

**Решение**: Разделение на модули по доменам:
- `routes/functions.ts` — операции с функциями
- `routes/graph.ts` — граф вызовов
- `routes/dataflow.ts` — поток данных
- `routes/packages.ts` — пакеты
- `routes/sources.ts` — исходный код
- `routes/stats.ts` — статистика

**Преимущества**:
- Легко найти нужный код
- Простое добавление новых эндпоинтов
- Изоляция логики по доменам

### 2. Singleton для подключения к БД

**Проблема**: Множественные подключения к SQLite неэффективны.

**Решение**: Паттерн Singleton в `db.ts`:
```typescript
let db: Database.Database | null = null;

export function getDB(): Database.Database {
  if (db === null) {
    db = new Database(DB_PATH, { readonly: true });
    // Оптимизация pragmas
  }
  return db;
}
```

**Преимущества**:
- Одно подключение на весь lifecycle приложения
- Оптимизация через pragmas применяется один раз
- Меньше overhead

### 3. Prepared Statements

**Проблема**: Повторная компиляция SQL запросов замедляет работу.

**Решение**: Ленивая инициализация prepared statements:
```typescript
let searchStmt: Database.Statement | null = null;

function getSearchStmt(): Database.Statement {
  if (searchStmt === null) {
    searchStmt = prepare(`SELECT ... WHERE name LIKE ?`);
  }
  return searchStmt;
}
```

**Преимущества**:
- SQL компилируется один раз
- Защита от SQL injection
- Быстрее выполнение запросов

### 4. TanStack Query для кэширования

**Проблема**: Повторные запросы одних и тех же данных.

**Решение**: Использование TanStack Query:
```typescript
export function useFunction(id: string | null) {
  return useQuery<FunctionWithMetrics>({
    queryKey: ['function', id],
    queryFn: () => apiClient.getFunction(id!),
    enabled: id !== null,
    staleTime: 5 * 60 * 1000 // 5 минут
  });
}
```

**Преимущества**:
- Автоматическое кэширование
- Дедупликация запросов
- Фоновое обновление данных
- Оптимистичные обновления

### 5. Custom Hooks для абстракции логики

**Проблема**: Дублирование логики запросов в компонентах.

**Решение**: Custom hooks в `hooks/useApi.ts`:
- `useSearchFunctions` — поиск
- `useFunction` — детали функции
- `useNeighborhood` — окрестность функции
- `useVariables` — переменные функции
- `useBackwardSlice` / `useForwardSlice` — data flow slice

**Преимущества**:
- Переиспользование логики
- Единая точка управления запросами
- Легко тестировать

### 6. Разделение режимов работы

**Проблема**: Два разных режима (Call Graph и Data Flow) требуют разной логики.

**Решение**: Условный рендеринг в `App.tsx`:
```typescript
const [mode, setMode] = useState<'call-graph' | 'data-flow'>('call-graph');

{mode === 'call-graph' && <Sidebar ... />}
{mode === 'data-flow' && <DataFlowPanel ... />}
```

**Преимущества**:
- Чистое разделение UI
- Нет конфликтов состояний
- Легко добавить новые режимы

### 7. React Flow для визуализации

**Проблема**: Нужна интерактивная визуализация графов.

**Решение**: Использование React Flow с кастомными узлами:
- `CallerNode` — вызывающие функции (красный)
- `CalleeNode` — вызываемые функции (зелёный)
- `CenterNode` — центральная функция (жёлтый)
- `DefNode` — определения в data flow (фиолетовый)
- `UseNode` — использования в data flow (оранжевый)
- `OriginNode` — исходная переменная (синий)

**Преимущества**:
- Готовая библиотека с zoom, pan, minimap
- Кастомизация узлов и рёбер
- Производительность для больших графов

### 8. Dagre для layout графов

**Проблема**: Нужен читаемый layout для графов.

**Решение**: Использование dagre для иерархического layout:
```typescript
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setGraph({ rankdir: 'LR', nodesep: 50, ranksep: 100 });
dagre.layout(dagreGraph);
```

**Преимущества**:
- Иерархический layout (сверху вниз или слева направо)
- Настраиваемые отступы
- Читаемая структура

### 9. Ограничение глубины рекурсивных запросов

**Проблема**: Рекурсивные CTE могут быть очень глубокими.

**Решение**: Ограничение глубины в SQL:
```sql
WITH RECURSIVE chain(id, depth) AS (
  SELECT :function_id, 0
  UNION
  SELECT e.target, c.depth + 1
  FROM chain c JOIN edges e ON e.source = c.id
  WHERE e.kind = 'call' AND c.depth < 10  -- Ограничение
)
```

**Преимущества**:
- Предотвращение бесконечных циклов
- Контроль размера результата
- Быстрее выполнение

### 10. Read-only доступ к БД

**Проблема**: Приложение только читает данные, не нужно писать.

**Решение**: Открытие БД в read-only режиме:
```typescript
db = new Database(DB_PATH, { readonly: true });
```

**Преимущества**:
- Безопасность (нельзя случайно изменить данные)
- Оптимизация SQLite для read-only
- Можно использовать WAL mode для параллельного чтения

### 11. Оптимизация SQLite через Pragmas

**Проблема**: Нужна максимальная производительность чтения.

**Решение**: Настройка pragmas:
```typescript
db.pragma('journal_mode = WAL');        // Write-Ahead Logging
db.pragma('cache_size = -64000');       // 64MB кэш
db.pragma('mmap_size = 268435456');     // 256MB memory-mapped I/O
```

**Преимущества**:
- WAL позволяет параллельное чтение
- Большой кэш ускоряет повторные запросы
- Memory-mapped I/O быстрее для больших файлов

### 12. URL Encoding для ID с спецсимволами

**Проблема**: ID функций содержат `/` и другие спецсимволы, ломают роутинг.

**Решение**: Кодирование ID в frontend:
```typescript
getFunction: async (id: string) => {
  const response = await api.get(`/functions/${encodeURIComponent(id)}`);
  return response.data;
}
```

**Преимущества**:
- Корректная работа с любыми ID
- Express автоматически декодирует
- Безопасность

### 13. Resizable Sidebar

**Проблема**: Длинные названия функций обрезаются.

**Решение**: Drag-and-drop изменение ширины sidebar:
- Состояние `sidebarWidth` в `App.tsx`
- Drag handle на границе sidebar
- `break-words` вместо `truncate` для текста

**Преимущества**:
- Пользователь контролирует ширину
- Длинные названия видны полностью
- Улучшенный UX

---

## Потоки данных

### Call Graph Mode

1. **Выбор функции**:
   ```
   User clicks function
   → App.tsx: setSelectedFunctionId()
   → GraphView: useFunction() + useNeighborhood()
   → API: GET /api/functions/:id, GET /api/graph/:id/neighborhood
   → Backend: Query DB, return data
   → useGraph: loadNeighborhood()
   → React Flow: Render graph
   ```

2. **Клик по узлу графа**:
   ```
   User clicks node
   → GraphView: onNodeClick()
   → App.tsx: setSelectedNodeId()
   → SourcePanel: useFunction(selectedNodeId)
   → API: GET /api/functions/:id
   → SourcePanel: Display source code
   ```

### Data Flow Mode

1. **Выбор переменной**:
   ```
   User selects variable + direction
   → DataFlowPanel: onSelectVariable()
   → App.tsx: setSelectedVariableId() + setSliceDirection()
   → useBackwardSlice() or useForwardSlice()
   → API: GET /api/dataflow/:nodeId/backward-slice
   → Backend: Recursive CTE query
   → useGraph: loadDataFlowSlice()
   → React Flow: Render DFG graph
   → SourcePanel: Highlight lines from slice
   ```

---

## API Endpoints

### Functions
- `GET /api/functions/search?q=...&limit=50` — Поиск функций
- `GET /api/functions/:id` — Детали функции с метриками

### Graph (Call Graph)
- `GET /api/graph/:id/neighborhood` — Прямые callers и callees
- `GET /api/graph/:id/call-chain?depth=5` — Транзитивная цепочка вызовов
- `GET /api/graph/:id/callers?depth=3` — Все callers (транзитивно)

### Data Flow
- `GET /api/dataflow/:functionId/variables` — Переменные функции
- `GET /api/dataflow/:nodeId/backward-slice` — Backward slice (определения)
- `GET /api/dataflow/:nodeId/forward-slice` — Forward slice (использования)

### Packages
- `GET /api/packages` — Список всех пакетов
- `GET /api/packages/:name/functions` — Функции пакета

### Sources
- `GET /api/sources/:file` — Исходный код файла

### Stats
- `GET /api/stats` — Общая статистика (узлы, рёбра, файлы, пакеты)

---

## Компоненты Frontend

### App.tsx
**Роль**: Главный компонент, управление состоянием приложения

**Состояние**:
- `selectedFunctionId` — выбранная функция
- `selectedNodeId` — выбранный узел графа
- `mode` — режим работы ('call-graph' | 'data-flow')
- `selectedVariableId` — выбранная переменная
- `sliceDirection` — направление slice ('backward' | 'forward')
- `sidebarWidth` — ширина sidebar

**Логика**:
- Переключение режимов
- Управление состоянием выбора
- Вычисление подсвеченных строк для data flow

### SearchBar
**Роль**: Поиск функций по имени

**Особенности**:
- Debounced поиск (через TanStack Query)
- Dropdown с результатами
- Клик по результату → выбор функции

### Sidebar
**Роль**: Навигация по пакетам и функциям

**Особенности**:
- Двухуровневая навигация (пакеты → функции)
- Resizable (управляется из App.tsx)
- `break-words` для длинных названий

### GraphView
**Роль**: Визуализация графа (Call Graph или Data Flow)

**Особенности**:
- React Flow с кастомными узлами
- Dagre layout
- Zoom, pan, minimap
- Клик по узлу → выбор узла

### SourcePanel
**Роль**: Отображение исходного кода

**Особенности**:
- Подсветка синтаксиса Go (Prism.js)
- Нумерация строк
- Подсветка строк из data flow slice
- Показ контекста вокруг функции

### FunctionDetails
**Роль**: Метрики функции

**Отображает**:
- Cyclomatic complexity
- Fan-in / Fan-out
- LOC (Lines of Code)
- Тип функции

### DataFlowPanel
**Роль**: Выбор переменной и направления slice

**Особенности**:
- Группировка переменных (parameters, locals, results)
- Переключатель направления (backward/forward)
- Выбор переменной → запуск slice

---

## Производительность

### Оптимизации Backend

1. **Prepared Statements**: SQL компилируется один раз
2. **Read-only режим**: SQLite оптимизирован для чтения
3. **Pragmas**: WAL, большой кэш, memory-mapped I/O
4. **Ограничение глубины**: Предотвращение огромных результатов
5. **Singleton DB**: Одно подключение

### Оптимизации Frontend

1. **TanStack Query**: Кэширование запросов (5 минут staleTime)
2. **Lazy loading**: Данные загружаются только при необходимости
3. **Debouncing**: Поиск не отправляет запрос на каждый символ
4. **Ограничение размера графа**: 10-60 узлов на вид
5. **React.memo**: Можно добавить для компонентов (если нужно)

### Масштабируемость

**Текущие ограничения**:
- Один экземпляр backend (stateless, можно масштабировать)
- SQLite read-only (можно использовать реплики)
- Frontend статический (можно раздавать через CDN)

**Потенциальные улучшения**:
- Redis для кэширования популярных запросов
- Connection pooling (если перейти на PostgreSQL)
- GraphQL для более гибких запросов

---

## Безопасность

### Backend
- **Read-only БД**: Невозможно изменить данные
- **Prepared Statements**: Защита от SQL injection
- **URL Encoding**: Корректная обработка спецсимволов
- **CORS**: Настроен для frontend

### Frontend
- **TypeScript**: Типобезопасность
- **URL Encoding**: Корректная передача ID
- **Input validation**: Через TypeScript типы

---

## Тестирование

**Текущее состояние**: Нет автоматических тестов

**Рекомендации для будущего**:
- Unit тесты для hooks (useApi, useGraph)
- Integration тесты для API endpoints
- E2E тесты для критических сценариев (Playwright/Cypress)

---

## Развёртывание

### Docker Compose
- Два сервиса: `backend` и `frontend`
- Health checks для backend
- Зависимости: frontend ждёт готовности backend
- Volumes: монтирование базы данных

### Environment Variables
- `DB_PATH` — путь к базе данных (backend)
- `VITE_API_URL` — URL API (frontend, build-time)

---

## Ключевые метрики проекта

- **Строк кода**: ~3000+ (TypeScript)
- **Компонентов**: 7 React компонентов
- **API endpoints**: 11
- **Custom hooks**: 2
- **Время разработки**: ~24 часа (по заданию)
- **Размер БД**: ~900 MB
- **Узлов в графе**: ~555,000
- **Рёбер в графе**: ~1,500,000

---

## Возможности для улучшения

1. **Тестирование**: Добавить unit и integration тесты
2. **Обработка ошибок**: Более детальные error messages
3. **Loading states**: Skeleton loaders вместо простых индикаторов
4. **Keyboard shortcuts**: Навигация с клавиатуры
5. **Export**: Экспорт графов в PNG/SVG
6. **Фильтры**: Фильтрация узлов по типу, пакету
7. **Поиск в графе**: Поиск узлов в текущем графе
8. **История**: Навигация назад/вперёд по выбранным функциям

---

## Заключение

Проект демонстрирует:
- ✅ Понимание архитектуры full-stack приложений
- ✅ Работу с большими объёмами данных
- ✅ Оптимизацию производительности
- ✅ Современный стек технологий
- ✅ Модульную структуру кода
- ✅ TypeScript для типобезопасности
- ✅ Docker для развёртывания
- ✅ Два режима работы (Call Graph + Data Flow)

