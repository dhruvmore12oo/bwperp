/**
 * Middleware to verify that the request has an active authenticated session.
 * If req.session.user exists, proceeds to the next middleware/route handler.
 * Otherwise, returns 401 Unauthenticated.
 */
function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

module.exports = requireAuth;
