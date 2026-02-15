# CPG Code Explorer Project Architecture

## Project Overview

**CPG Code Explorer** is a web application for exploring Go codebase through Code Property Graph (CPG). The project implements two main modes:
1. **Call Graph Explorer** — visualization of function call graphs
2. **Data Flow Slicer** — data flow analysis through variables

### Data Scale
- Database: ~900 MB SQLite
- Nodes: ~555,000
- Edges: ~1,500,000
- Packages: ~170
- Files: thousands

---

## System Architecture

### General Schema

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

## Project Structure

```
cpg-explorer/
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── index.ts           # Entry point, Express setup
│   │   ├── db.ts              # Database layer (singleton)
│   │   ├── types.ts           # TypeScript types for backend
│   │   └── routes/            # API routes (modular structure)
│   │       ├── functions.ts   # Function search and details
│   │       ├── graph.ts       # Call graph operations
│   │       ├── dataflow.ts    # Data flow slice operations
│   │       ├── packages.ts    # Package operations
│   │       ├── sources.ts     # Source code
│   │       └── stats.ts        # Statistics
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                   # React + TypeScript SPA
│   ├── src/
│   │   ├── App.tsx            # Main component, state management
│   │   ├── main.tsx           # React entry point
│   │   ├── types.ts           # TypeScript types for frontend
│   │   ├── api/
│   │   │   └── client.ts      # Axios HTTP client
│   │   ├── components/        # React components
│   │   │   ├── SearchBar.tsx      # Function search
│   │   │   ├── Sidebar.tsx         # Package navigation
│   │   │   ├── GraphView.tsx       # Graph visualization (React Flow)
│   │   │   ├── SourcePanel.tsx    # Source code view
│   │   │   ├── FunctionDetails.tsx # Function metrics
│   │   │   └── DataFlowPanel.tsx  # Variable selection panel
│   │   └── hooks/             # Custom React hooks
│   │       ├── useApi.ts      # API request hooks (TanStack Query)
│   │       └── useGraph.ts    # Graph logic
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts         # Vite configuration
│   └── tailwind.config.js    # Tailwind CSS configuration
│
├── data/                       # CPG database
│   └── cpg.db                  # SQLite file (~900 MB)
│
├── docker-compose.yml          # Service orchestration
├── README.md                   # Main documentation
├── DOCKER.md                   # Docker instructions
└── SETUP_DB.md                 # Database generation instructions
```

---

## Tech Stack

### Frontend
- **React 18** — UI library
- **TypeScript** — type safety
- **Vite** — build tool and dev server
- **@xyflow/react (React Flow v12)** — graph visualization
- **dagre** — graph layout algorithm
- **TanStack Query (React Query)** — state management and API caching
- **Axios** — HTTP client
- **Tailwind CSS** — utility-first CSS
- **Prism.js** — Go syntax highlighting
- **react-simple-code-editor** — code editor

### Backend
- **Node.js 20** — runtime
- **Express** — web framework
- **TypeScript** — type safety
- **better-sqlite3** — synchronous SQLite driver
- **CORS** — cross-origin request handling

### Infrastructure
- **Docker** — containerization
- **Docker Compose** — orchestration
- **SQLite** — database (read-only)

---

## Architectural Decisions

### 1. Modular Backend Structure

**Problem**: Monolithic route file is hard to maintain.

**Solution**: Split into domain modules:
- `routes/functions.ts` — function operations
- `routes/graph.ts` — call graph
- `routes/dataflow.ts` — data flow
- `routes/packages.ts` — packages
- `routes/sources.ts` — source code
- `routes/stats.ts` — statistics

**Advantages**:
- Easy to find needed code
- Simple to add new endpoints
- Logic isolation by domain

### 2. Singleton for Database Connection

**Problem**: Multiple SQLite connections are inefficient.

**Solution**: Singleton pattern in `db.ts`:
```typescript
let db: Database.Database | null = null;

export function getDB(): Database.Database {
  if (db === null) {
    db = new Database(DB_PATH, { readonly: true });
    // Pragma optimization
  }
  return db;
}
```

**Advantages**:
- Single connection for entire application lifecycle
- Pragma optimization applied once
- Less overhead

### 3. Prepared Statements

**Problem**: Repeated SQL query compilation slows down performance.

**Solution**: Lazy initialization of prepared statements:
```typescript
let searchStmt: Database.Statement | null = null;

function getSearchStmt(): Database.Statement {
  if (searchStmt === null) {
    searchStmt = prepare(`SELECT ... WHERE name LIKE ?`);
  }
  return searchStmt;
}
```

**Advantages**:
- SQL compiled once
- SQL injection protection
- Faster query execution

### 4. TanStack Query for Caching

**Problem**: Repeated requests for the same data.

**Solution**: Using TanStack Query:
```typescript
export function useFunction(id: string | null) {
  return useQuery<FunctionWithMetrics>({
    queryKey: ['function', id],
    queryFn: () => apiClient.getFunction(id!),
    enabled: id !== null,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}
```

**Advantages**:
- Automatic caching
- Request deduplication
- Background data updates
- Optimistic updates

### 5. Custom Hooks for Logic Abstraction

**Problem**: Duplication of request logic in components.

**Solution**: Custom hooks in `hooks/useApi.ts`:
- `useSearchFunctions` — search
- `useFunction` — function details
- `useNeighborhood` — function neighborhood
- `useVariables` — function variables
- `useBackwardSlice` / `useForwardSlice` — data flow slice

**Advantages**:
- Logic reuse
- Single point of request management
- Easy to test

### 6. Mode Separation

**Problem**: Two different modes (Call Graph and Data Flow) require different logic.

**Solution**: Conditional rendering in `App.tsx`:
```typescript
const [mode, setMode] = useState<'call-graph' | 'data-flow'>('call-graph');

{mode === 'call-graph' && <Sidebar ... />}
{mode === 'data-flow' && <DataFlowPanel ... />}
```

**Advantages**:
- Clean UI separation
- No state conflicts
- Easy to add new modes

### 7. React Flow for Visualization

**Problem**: Need interactive graph visualization.

**Solution**: Using React Flow with custom nodes:
- `CallerNode` — calling functions (red)
- `CalleeNode` — called functions (green)
- `CenterNode` — center function (yellow)
- `DefNode` — definitions in data flow (purple)
- `UseNode` — uses in data flow (orange)
- `OriginNode` — origin variable (blue)

**Advantages**:
- Ready library with zoom, pan, minimap
- Node and edge customization
- Performance for large graphs

### 8. Dagre for Graph Layout

**Problem**: Need readable layout for graphs.

**Solution**: Using dagre for hierarchical layout:
```typescript
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setGraph({ rankdir: 'LR', nodesep: 50, ranksep: 100 });
dagre.layout(dagreGraph);
```

**Advantages**:
- Hierarchical layout (top to bottom or left to right)
- Configurable spacing
- Readable structure

### 9. Recursive Query Depth Limiting

**Problem**: Recursive CTEs can be very deep.

**Solution**: Depth limiting in SQL:
```sql
WITH RECURSIVE chain(id, depth) AS (
  SELECT :function_id, 0
  UNION
  SELECT e.target, c.depth + 1
  FROM chain c JOIN edges e ON e.source = c.id
  WHERE e.kind = 'call' AND c.depth < 10  -- Limit
)
```

**Advantages**:
- Prevents infinite loops
- Controls result size
- Faster execution

### 10. Read-only Database Access

**Problem**: Application only reads data, no need to write.

**Solution**: Opening database in read-only mode:
```typescript
db = new Database(DB_PATH, { readonly: true });
```

**Advantages**:
- Security (cannot accidentally modify data)
- SQLite optimization for read-only
- Can use WAL mode for parallel reads

### 11. SQLite Optimization via Pragmas

**Problem**: Need maximum read performance.

**Solution**: Pragma configuration:
```typescript
db.pragma('journal_mode = WAL');        // Write-Ahead Logging
db.pragma('cache_size = -64000');       // 64MB cache
db.pragma('mmap_size = 268435456');     // 256MB memory-mapped I/O
```

**Advantages**:
- WAL allows parallel reads
- Large cache speeds up repeated queries
- Memory-mapped I/O faster for large files

### 12. URL Encoding for IDs with Special Characters

**Problem**: Function IDs contain `/` and other special characters, break routing.

**Solution**: ID encoding in frontend:
```typescript
getFunction: async (id: string) => {
  const response = await api.get(`/functions/${encodeURIComponent(id)}`);
  return response.data;
}
```

**Advantages**:
- Correct work with any IDs
- Express automatically decodes
- Security

### 13. Resizable Sidebar

**Problem**: Long function names get truncated.

**Solution**: Drag-and-drop sidebar width change:
- `sidebarWidth` state in `App.tsx`
- Drag handle on sidebar border
- `break-words` instead of `truncate` for text

**Advantages**:
- User controls width
- Long names fully visible
- Improved UX

---

## Data Flows

### Call Graph Mode

1. **Function Selection**:
   ```
   User clicks function
   → App.tsx: setSelectedFunctionId()
   → GraphView: useFunction() + useNeighborhood()
   → API: GET /api/functions/:id, GET /api/graph/:id/neighborhood
   → Backend: Query DB, return data
   → useGraph: loadNeighborhood()
   → React Flow: Render graph
   ```

2. **Graph Node Click**:
   ```
   User clicks node
   → GraphView: onNodeClick()
   → App.tsx: setSelectedNodeId()
   → SourcePanel: useFunction(selectedNodeId)
   → API: GET /api/functions/:id
   → SourcePanel: Display source code
   ```

### Data Flow Mode

1. **Variable Selection**:
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
- `GET /api/functions/search?q=...&limit=50` — Search functions
- `GET /api/functions/:id` — Function details with metrics

### Graph (Call Graph)
- `GET /api/graph/:id/neighborhood` — Direct callers and callees
- `GET /api/graph/:id/call-chain?depth=5` — Transitive call chain
- `GET /api/graph/:id/callers?depth=3` — All callers (transitively)

### Data Flow
- `GET /api/dataflow/:functionId/variables` — Function variables
- `GET /api/dataflow/:nodeId/backward-slice` — Backward slice (definitions)
- `GET /api/dataflow/:nodeId/forward-slice` — Forward slice (usages)

### Packages
- `GET /api/packages` — List of all packages
- `GET /api/packages/:name/functions` — Package functions

### Sources
- `GET /api/sources/:file` — File source code

### Stats
- `GET /api/stats` — Overall statistics (nodes, edges, files, packages)

---

## Frontend Components

### App.tsx
**Role**: Main component, application state management

**State**:
- `selectedFunctionId` — selected function
- `selectedNodeId` — selected graph node
- `mode` — operation mode ('call-graph' | 'data-flow')
- `selectedVariableId` — selected variable
- `sliceDirection` — slice direction ('backward' | 'forward')
- `sidebarWidth` — sidebar width

**Logic**:
- Mode switching
- Selection state management
- Highlighted lines calculation for data flow

### SearchBar
**Role**: Function search by name

**Features**:
- Debounced search (via TanStack Query)
- Results dropdown
- Click on result → function selection

### Sidebar
**Role**: Package and function navigation

**Features**:
- Two-level navigation (packages → functions)
- Resizable (controlled from App.tsx)
- `break-words` for long names

### GraphView
**Role**: Graph visualization (Call Graph or Data Flow)

**Features**:
- React Flow with custom nodes
- Dagre layout
- Zoom, pan, minimap
- Node click → node selection

### SourcePanel
**Role**: Source code display

**Features**:
- Go syntax highlighting (Prism.js)
- Line numbers
- Highlighting lines from data flow slice
- Show context around function

### FunctionDetails
**Role**: Function metrics

**Displays**:
- Cyclomatic complexity
- Fan-in / Fan-out
- LOC (Lines of Code)
- Function type

### DataFlowPanel
**Role**: Variable selection and slice direction

**Features**:
- Variable grouping (parameters, locals, results)
- Direction toggle (backward/forward)
- Variable selection → start slice

---

## Performance

### Backend Optimizations

1. **Prepared Statements**: SQL compiled once
2. **Read-only mode**: SQLite optimized for reading
3. **Pragmas**: WAL, large cache, memory-mapped I/O
4. **Depth limiting**: Prevents huge results
5. **Singleton DB**: Single connection

### Frontend Optimizations

1. **TanStack Query**: Request caching (5 minutes staleTime)
2. **Lazy loading**: Data loaded only when needed
3. **Debouncing**: Search doesn't send request on every character
4. **Graph size limiting**: 10-60 nodes per view
5. **React.memo**: Can be added for components (if needed)

### Scalability

**Current Limitations**:
- Single backend instance (stateless, can scale)
- SQLite read-only (can use replicas)
- Frontend static (can serve via CDN)

**Potential Improvements**:
- Redis for caching popular queries
- Connection pooling (if switching to PostgreSQL)
- GraphQL for more flexible queries

---

## Security

### Backend
- **Read-only DB**: Cannot modify data
- **Prepared Statements**: SQL injection protection
- **URL Encoding**: Correct special character handling
- **CORS**: Configured for frontend

### Frontend
- **TypeScript**: Type safety
- **URL Encoding**: Correct ID passing
- **Input validation**: Via TypeScript types

---

## Testing

**Current State**: No automated tests

**Future Recommendations**:
- Unit tests for hooks (useApi, useGraph)
- Integration tests for API endpoints
- E2E tests for critical scenarios (Playwright/Cypress)

---

## Deployment

### Docker Compose
- Two services: `backend` and `frontend`
- Health checks for backend
- Dependencies: frontend waits for backend readiness
- Volumes: database mounting

### Environment Variables
- `DB_PATH` — database path (backend)
- `VITE_API_URL` — API URL (frontend, build-time)

---

## Key Project Metrics

- **Lines of code**: ~3000+ (TypeScript)
- **Components**: 7 React components
- **API endpoints**: 11
- **Custom hooks**: 2
- **Development time**: ~24 hours (per assignment)
- **Database size**: ~900 MB
- **Graph nodes**: ~555,000
- **Graph edges**: ~1,500,000

---

## Improvement Opportunities

1. **Testing**: Add unit and integration tests
2. **Error handling**: More detailed error messages
3. **Loading states**: Skeleton loaders instead of simple indicators
4. **Keyboard shortcuts**: Keyboard navigation
5. **Export**: Export graphs to PNG/SVG
6. **Filters**: Filter nodes by type, package
7. **Graph search**: Search nodes in current graph
8. **History**: Back/forward navigation through selected functions

---

## Conclusion

The project demonstrates:
- ✅ Understanding of full-stack application architecture
- ✅ Working with large data volumes
- ✅ Performance optimization
- ✅ Modern tech stack
- ✅ Modular code structure
- ✅ TypeScript for type safety
- ✅ Docker for deployment
- ✅ Two operation modes (Call Graph + Data Flow)
