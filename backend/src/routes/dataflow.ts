import { Router } from 'express';
import { query, prepare } from '../db';
import { Node } from '../types';
import type Database from 'better-sqlite3';

const router = Router();

// Ленивая инициализация prepared statements
let variablesStmt: Database.Statement | null = null;

function getVariablesStmt(): Database.Statement {
  if (variablesStmt === null) {
    variablesStmt = prepare(`
      SELECT n.id, n.name, n.kind, n.type_info, n.file, n.line, n.col, n.end_line, n.package, n.parent_function, n.properties
      FROM nodes n
      JOIN edges e ON e.source = ? AND e.target = n.id AND e.kind = 'ast'
      WHERE n.kind IN ('parameter', 'result', 'local')
      ORDER BY n.line
    `);
  }
  return variablesStmt;
}


/**
 * Получить переменные функции (parameters, locals, results)
 * GET /api/dataflow/:functionId/variables
 */
router.get('/:functionId/variables', (req, res) => {
  try {
    const functionId = decodeURIComponent(req.params.functionId);
    const results = getVariablesStmt().all(functionId) as Array<{
      id: string;
      name: string;
      kind: string;
      type_info: string | null;
      file: string | null;
      line: number | null;
      col: number | null;
      end_line: number | null;
      package: string | null;
      parent_function: string | null;
      properties: string | null;
    }>;
    
    const variables: Node[] = results.map(row => ({
      id: row.id,
      kind: row.kind,
      name: row.name,
      file: row.file,
      line: row.line,
      col: row.col,
      end_line: row.end_line,
      package: row.package,
      parent_function: row.parent_function,
      type_info: row.type_info,
      properties: row.properties
    }));
    
    res.json(variables);
  } catch (error) {
    console.error('Ошибка получения переменных:', error);
    res.status(500).json({ error: 'Ошибка при получении переменных' });
    return;
  }
});

/**
 * Получить backward slice (все узлы, которые влияют на данный узел через data flow)
 * GET /api/dataflow/:nodeId/backward-slice?depth=20
 */
router.get('/:nodeId/backward-slice', (req, res) => {
  try {
    const nodeId = decodeURIComponent(req.params.nodeId);
    const depth = parseInt(req.query.depth as string || '20', 10);
    
    // Используем параметризованный запрос для безопасности
    const sql = `
      WITH RECURSIVE slice(id, depth) AS (
        SELECT ?, 0
        UNION
        SELECT e.source, s.depth + 1
        FROM slice s JOIN edges e ON e.target = s.id
        WHERE e.kind IN ('dfg', 'param_in') AND s.depth < ?
      )
      SELECT DISTINCT n.* FROM slice s JOIN nodes n ON n.id = s.id ORDER BY n.file, n.line
    `;
    
    const results = query<{
      id: string;
      kind: string;
      name: string;
      file: string | null;
      line: number | null;
      col: number | null;
      end_line: number | null;
      package: string | null;
      parent_function: string | null;
      type_info: string | null;
      properties: string | null;
    }>>(sql, [nodeId, depth]);
    
    const nodes: Node[] = results.map(row => ({
      id: row.id,
      kind: row.kind,
      name: row.name,
      file: row.file,
      line: row.line,
      col: row.col,
      end_line: row.end_line,
      package: row.package,
      parent_function: row.parent_function,
      type_info: row.type_info,
      properties: row.properties
    }));
    
    // Получаем DFG рёбра между узлами среза для визуализации графа
    if (nodes.length > 0) {
      const nodeIds = nodes.map(n => n.id);
      // Используем параметризованный запрос для безопасности
      const placeholders = nodeIds.map(() => '?').join(',');
      const edgesSql = `
        SELECT e.source, e.target, e.kind, e.properties
        FROM edges e
        WHERE e.kind = 'dfg' 
          AND e.source IN (${placeholders})
          AND e.target IN (${placeholders})
      `;
      const edges = query<{ source: string; target: string; kind: string; properties: string | null }>(edgesSql, [...nodeIds, ...nodeIds]);
      
      res.json({ nodes, edges });
    } else {
      res.json({ nodes: [], edges: [] });
    }
  } catch (error) {
    console.error('Ошибка получения backward slice:', error);
    res.status(500).json({ error: 'Ошибка при получении backward slice' });
    return;
  }
});

/**
 * Получить forward slice (все узлы, на которые влияет данный узел через data flow)
 * GET /api/dataflow/:nodeId/forward-slice?depth=20
 */
router.get('/:nodeId/forward-slice', (req, res) => {
  try {
    const nodeId = decodeURIComponent(req.params.nodeId);
    const depth = parseInt(req.query.depth as string || '20', 10);
    
    // Используем параметризованный запрос для безопасности
    const sql = `
      WITH RECURSIVE slice(id, depth) AS (
        SELECT ?, 0
        UNION
        SELECT e.target, s.depth + 1
        FROM slice s JOIN edges e ON e.source = s.id
        WHERE e.kind IN ('dfg', 'param_out') AND s.depth < ?
      )
      SELECT DISTINCT n.* FROM slice s JOIN nodes n ON n.id = s.id ORDER BY n.file, n.line
    `;
    
    const results = query<{
      id: string;
      kind: string;
      name: string;
      file: string | null;
      line: number | null;
      col: number | null;
      end_line: number | null;
      package: string | null;
      parent_function: string | null;
      type_info: string | null;
      properties: string | null;
    }>>(sql, [nodeId, depth]);
    
    const nodes: Node[] = results.map(row => ({
      id: row.id,
      kind: row.kind,
      name: row.name,
      file: row.file,
      line: row.line,
      col: row.col,
      end_line: row.end_line,
      package: row.package,
      parent_function: row.parent_function,
      type_info: row.type_info,
      properties: row.properties
    }));
    
    // Получаем DFG рёбра между узлами среза для визуализации графа
    if (nodes.length > 0) {
      const nodeIds = nodes.map(n => n.id);
      // Используем параметризованный запрос для безопасности
      const placeholders = nodeIds.map(() => '?').join(',');
      const edgesSql = `
        SELECT e.source, e.target, e.kind, e.properties
        FROM edges e
        WHERE e.kind = 'dfg' 
          AND e.source IN (${placeholders})
          AND e.target IN (${placeholders})
      `;
      const edges = query<{ source: string; target: string; kind: string; properties: string | null }>(edgesSql, [...nodeIds, ...nodeIds]);
      
      res.json({ nodes, edges });
    } else {
      res.json({ nodes: [], edges: [] });
    }
  } catch (error) {
    console.error('Ошибка получения forward slice:', error);
    res.status(500).json({ error: 'Ошибка при получении forward slice' });
    return;
  }
});

export default router;

