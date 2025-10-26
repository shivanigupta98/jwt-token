const ACCESS_TOKEN_KEY = process.env.ACCESS_TOKEN_KEY;
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const userAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const accessToken = authHeader.split(' ')[1];
        const decoded = jwt.verify(accessToken, ACCESS_TOKEN_KEY);
        const user = await User.findOne({ _id: decoded.userId });
        if (!user) {
            res.status(403).json({ error: 'User not Found' });
        }
        req.user = user;
        next();
    }
    catch (err) {
        res.status(401).json({ error: `Error: ${err.message}` });
    }
}

module.exports = userAuth;
