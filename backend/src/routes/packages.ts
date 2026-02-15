import { Router } from 'express';
import { query } from '../db';
import { Package, Node, PackageDependency, PackageTreemap, FunctionDetail } from '../types';

const router = Router();

/**
 * Get list of all packages
 * GET /api/packages
 */
router.get('/', (_req, res) => {
  try {
    const sql = `
      SELECT package, files, functions, types, loc
      FROM stats_packages
      ORDER BY package
    `;
    
    const packages = query<Package>(sql);
    return res.json(packages);
  } catch (error) {
    console.error('Error fetching packages:', error);
    return res.status(500).json({ error: 'Error fetching packages' });
  }
});

/**
 * Get package dependency graph
 * GET /api/packages/graph?limit=200&minWeight=3
 */
router.get('/graph', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 200, 1000);
    const minWeight = parseInt(req.query.minWeight as string) || 3;
    
    const sql = `
      SELECT source, target, weight
      FROM dashboard_package_graph
      WHERE weight >= ?
      ORDER BY weight DESC
      LIMIT ?
    `;
    
    const dependencies = query<PackageDependency>(sql, [minWeight, limit]);
    return res.json(dependencies);
  } catch (error) {
    console.error('Error fetching package graph:', error);
    return res.status(500).json({ error: 'Error fetching package graph' });
  }
});

/**
 * Get package metrics for treemap
 * GET /api/packages/treemap
 */
router.get('/treemap', (_req, res) => {
  try {
    const sql = `
      SELECT package, file_count, function_count, total_loc, total_complexity,
        avg_complexity, max_complexity, type_count, interface_count
      FROM dashboard_package_treemap
      ORDER BY total_complexity DESC
    `;
    
    const treemap = query<PackageTreemap>(sql);
    return res.json(treemap);
  } catch (error) {
    console.error('Error fetching package treemap:', error);
    return res.status(500).json({ error: 'Error fetching package treemap' });
  }
});

/**
 * Get package function details
 * GET /api/packages/:name/details
 */
router.get('/:name/details', (req, res) => {
  try {
    const packageName = decodeURIComponent(req.params.name);
    
    const sql = `
      SELECT function_id, name, package, file, line, end_line, signature,
        complexity, loc, fan_in, fan_out, num_params, num_locals, num_calls,
        num_branches, num_returns, finding_count, callers, callees
      FROM dashboard_function_detail
      WHERE package = ?
      ORDER BY complexity DESC, name
    `;
    
    const functions = query<FunctionDetail>(sql, [packageName]);
    return res.json(functions);
  } catch (error) {
    console.error('Error fetching package details:', error);
    return res.status(500).json({ error: 'Error fetching package details' });
  }
});

/**
 * Get all functions in a package
 * GET /api/packages/:name/functions
 */
router.get('/:name/functions', (req, res) => {
  try {
    const packageName = decodeURIComponent(req.params.name);
    
    const sql = `
      SELECT n.id, n.name, n.file, n.line, n.end_line,
        m.cyclomatic_complexity, m.fan_in, m.fan_out, m.loc
      FROM nodes n
      LEFT JOIN metrics m ON m.function_id = n.id
      WHERE n.package = ? AND n.kind = 'function'
      ORDER BY n.name
    `;
    
    const functions = query<Node>(sql, [packageName]);
    return res.json(functions);
  } catch (error) {
    console.error('Error fetching package functions:', error);
    return res.status(500).json({ error: 'Error fetching package functions' });
  }
});

export default router;

