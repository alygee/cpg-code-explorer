import { Router } from 'express';
import { prepare } from '../db';
import { FunctionWithMetrics, SearchResult } from '../types';
import type Database from 'better-sqlite3';

const router = Router();

// Lazy initialization of prepared statements
let searchStmt: Database.Statement | null = null;
let functionByIdStmt: Database.Statement | null = null;

function getSearchStmt(): Database.Statement {
  if (searchStmt === null) {
    searchStmt = prepare(`
      SELECT id, name, kind, package, file, line
      FROM symbol_index
      WHERE name LIKE ? AND kind = 'function'
      ORDER BY name
      LIMIT ?
    `);
  }
  return searchStmt;
}

function getFunctionByIdStmt(): Database.Statement {
  if (functionByIdStmt === null) {
    functionByIdStmt = prepare(`
      SELECT n.*, 
        m.cyclomatic_complexity,
        m.fan_in,
        m.fan_out,
        m.loc
      FROM nodes n
      LEFT JOIN metrics m ON m.function_id = n.id
      WHERE n.id = ? AND n.kind = 'function'
    `);
  }
  return functionByIdStmt;
}

/**
 * Search functions by name
 * GET /api/functions/search?q=...&limit=50
 */
router.get('/search', (req, res) => {
  try {
    const searchTerm = req.query.q as string || '';
    const limit = parseInt(req.query.limit as string || '50', 10);
    
    if (!searchTerm) {
      return res.json([]);
    }
    
    const pattern = `%${searchTerm}%`;
    const results = getSearchStmt().all(pattern, limit) as SearchResult[];
    
    return res.json(results);
  } catch (error) {
    console.error('Error searching functions:', error);
    return res.status(500).json({ error: 'Error searching functions' });
  }
});

/**
 * Get function details by ID
 * GET /api/functions/:id
 */
router.get('/:id', (req, res) => {
  try {
    const functionId = req.params.id;
    const func = getFunctionByIdStmt().get(functionId) as FunctionWithMetrics | undefined;
    
    if (!func) {
      return res.status(404).json({ error: 'Function not found' });
    }
    
    return res.json(func);
  } catch (error) {
    console.error('Error fetching function:', error);
    return res.status(500).json({ error: 'Error fetching function' });
  }
});

export default router;

