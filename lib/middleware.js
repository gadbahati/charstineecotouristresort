const jwt = require('jsonwebtoken');

// Middleware for JWT verification
function verifyToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).send('A token is required for authentication');

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).send('Invalid Token');
        req.user = decoded;
        next();
    });
}

// Middleware for admin route protection
function verifyAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).send('Access denied. Admins only!');
    }
}

module.exports = { verifyToken, verifyAdmin };