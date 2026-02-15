import { Router } from 'express';
import { query, prepare } from '../db';
import { Node, FunctionNeighborhood, CallChainNode } from '../types';
import type Database from 'better-sqlite3';

const router = Router();

// Ленивая инициализация prepared statements
let neighborhoodStmt: Database.Statement | null = null;

function getNeighborhoodStmt(): Database.Statement {
  if (neighborhoodStmt === null) {
    neighborhoodStmt = prepare(`
      SELECT 'caller' AS direction, n.id, n.name, n.package, n.file, n.line, n.kind, n.type_info, n.properties
      FROM edges e JOIN nodes n ON n.id = e.source
      WHERE e.target = ? AND e.kind = 'call' AND n.kind = 'function'
      UNION ALL
      SELECT 'callee' AS direction, n.id, n.name, n.package, n.file, n.line, n.kind, n.type_info, n.properties
      FROM edges e JOIN nodes n ON n.id = e.target
      WHERE e.source = ? AND e.kind = 'call' AND n.kind = 'function'
      ORDER BY direction, name
    `);
  }
  return neighborhoodStmt;
}

/**
 * Получить neighborhood функции (callers и callees)
 * GET /api/graph/:id/neighborhood
 */
router.get('/:id/neighborhood', (req, res) => {
  try {
    const functionId = req.params.id;
    const results = getNeighborhoodStmt().all(functionId, functionId) as Array<{
      direction: string;
      id: string;
      name: string;
      package: string | null;
      file: string | null;
      line: number | null;
      kind: string;
      type_info: string | null;
      properties: string | null;
    }>;
    
    const callers: Node[] = [];
    const callees: Node[] = [];
    
    results.forEach(row => {
      const node: Node = {
        id: row.id,
        kind: row.kind,
        name: row.name,
        file: row.file,
        line: row.line,
        col: null,
        end_line: null,
        package: row.package,
        parent_function: null,
        type_info: row.type_info,
        properties: row.properties
      };
      
      if (row.direction === 'caller') {
        callers.push(node);
      } else {
        callees.push(node);
      }
    });
    
    const neighborhood: FunctionNeighborhood = { callers, callees };
    res.json(neighborhood);
  } catch (error) {
    console.error('Ошибка получения neighborhood:', error);
    res.status(500).json({ error: 'Ошибка при получении neighborhood' });
  }
});

/**
 * Получить транзитивную цепочку вызовов
 * GET /api/graph/:id/call-chain?depth=5
 */
router.get('/:id/call-chain', (req, res) => {
  try {
    const functionId = req.params.id;
    const depth = parseInt(req.query.depth as string || '5', 10);
    
    const sql = `
      WITH RECURSIVE chain(id, depth, path) AS (
        SELECT ?, 0, ?
        UNION
        SELECT e.target, c.depth + 1, c.path || ' -> ' || e.target
        FROM chain c JOIN edges e ON e.source = c.id
        WHERE e.kind = 'call' AND c.depth < ?
          AND c.path NOT LIKE '%' || e.target || '%'
      )
      SELECT DISTINCT n.id, n.name, n.package, c.depth
      FROM chain c JOIN nodes n ON n.id = c.id 
      WHERE n.kind = 'function'
      ORDER BY c.depth, n.name
    `;
    
    const results = query<CallChainNode>(sql, [functionId, functionId, depth]);
    res.json(results);
  } catch (error) {
    console.error('Ошибка получения call chain:', error);
    res.status(500).json({ error: 'Ошибка при получении call chain' });
  }
});

/**
 * Получить всех callers функции (транзитивно)
 * GET /api/graph/:id/callers?depth=3
 */
router.get('/:id/callers', (req, res) => {
  try {
    const functionId = req.params.id;
    const depth = parseInt(req.query.depth as string || '3', 10);
    
    const sql = `
      WITH RECURSIVE callers(id, depth) AS (
        SELECT ?, 0
        UNION
        SELECT e.source, c.depth + 1
        FROM callers c JOIN edges e ON e.target = c.id
        WHERE e.kind = 'call' AND c.depth < ?
      )
      SELECT DISTINCT n.id, n.name, n.package, n.file, n.line, c.depth
      FROM callers c JOIN nodes n ON n.id = c.id
      WHERE n.kind = 'function'
      ORDER BY c.depth, n.name
    `;
    
    const results = query<Node>(sql, [functionId, depth]);
    res.json(results);
  } catch (error) {
    console.error('Ошибка получения callers:', error);
    res.status(500).json({ error: 'Ошибка при получении callers' });
  }
});

export default router;

