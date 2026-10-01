const db = require('../db');

/**
 * Middleware factory to enforce Role-Based Access Control (RBAC).
 * Queries role_permissions joined with permissions and roles for req.session.user.role.
 * Returns 403 Forbidden if the (module, action) pair isn't granted for the user's role.
 *
 * @param {string} moduleName - Module name (e.g., 'dashboard', 'sales_orders', 'inventory')
 * @param {string} actionName - Action name (e.g., 'view', 'create', 'edit', 'delete', 'approve')
 */
function requirePermission(moduleName, actionName) {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated first
      if (!req.session || !req.session.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const userRole = req.session.user.role;
      if (!userRole) {
        return res.status(403).json({ error: "Forbidden: user role not specified" });
      }

      // Query database to check if role has the requested module & action permission
      const checkPermissionQuery = `
        SELECT 1
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        JOIN roles r ON rp.role_id = r.id
        WHERE r.name = $1 AND p.module = $2 AND p.action = $3
      `;

      const result = await db.query(checkPermissionQuery, [userRole, moduleName, actionName]);

      if (result.rows.length === 0) {
        return res.status(403).json({ error: `Forbidden: permission '${actionName}' on '${moduleName}' denied` });
      }

      next();
    } catch (err) {
      console.error(`Error checking permission (${moduleName}, ${actionName}):`, err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

module.exports = requirePermission;
