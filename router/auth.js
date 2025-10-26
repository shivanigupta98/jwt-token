const express = require('express');
const authRouter = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Token = require('../models/token');
const ACCESS_TOKEN_KEY = process.env.ACCESS_TOKEN_KEY;
const REFRESH_TOKEN_KEY = process.env.REFRESH_TOKEN_KEY;

authRouter.post('/signup', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password required' });
        }
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }
        const hashPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashPassword });
        await user.save();
        res.json({ id: user._id, username: user.username });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
})

authRouter.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            throw new Error('Send username and password');
        }
        const user = await User.findOne({ username });
        if (!user) {
            throw new Error('User not found');
        }
        const isvalid = await bcrypt.compare(password, user.password);
        if (!isvalid) {
            throw new Error('Password incorrect');
        }
        const token = jwt.sign({ userId: user._id }, ACCESS_TOKEN_KEY, { expiresIn: '10m' });
        const refreshToken = jwt.sign({ userId: user._id }, REFRESH_TOKEN_KEY, { expiresIn: '7d' });
        const hashedToken = await bcrypt.hash(refreshToken, 10);
        const tokenDetails = new Token({ userId: user._id, refreshToken: hashedToken, revoked: false });

        await tokenDetails.save();
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        })
        return res.json({ accessToken: token, user: { id: user._id, username: user.username } });
    }
    catch (err) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
}
)
authRouter.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        if (!refreshToken) {
            throw new Error('Refresh token not found');
        }
        const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_KEY);
        console.log(decoded);
        const user = await User.findOne({ _id: decoded.userId });
        const dbToken = await Token.findOne({ userId: decoded.userId, revoked: false });
        if (!dbToken) {
            return res.status(403).json({ message: 'Token not found or revoked' });
        }
        const isTokenSame = await bcrypt.compare(refreshToken, dbToken.refreshToken);
        if (!isTokenSame) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        dbToken.revoked = true;
        await dbToken.save();

        const newToken = jwt.sign({ userId: user._id }, ACCESS_TOKEN_KEY, { expiresIn: '10m' });
        const newRefreshToken = jwt.sign({ userId: user._id }, REFRESH_TOKEN_KEY, { expiresIn: '7d' });
        const newHashed = await bcrypt.hash(newRefreshToken, 10);
        await Token.create({ userId: decoded.userId, refreshToken: newHashed });
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        })
        res.json({ accessToken: newToken });
    }
    catch (err) {
        res.status(403).json({ message: 'Token expired or invalid' });
    }
})

authRouter.post('/logout', async (req, res) => {
    const { refreshToken } = req.cookies;
    if (!refreshToken) return res.sendStatus(204);
    try {
        const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_KEY);
        await Token.updateOne({ userId: decoded.userId }, { revoked: true });
    }
    catch (err) {
        res.status(500).json({ message: 'Error while logging out', error: err.message });
    }
    res.cookie("refreshToken", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
        secure: true,
        sameSite: "none",
    })
    res.json({ message: 'Logout successful' });
})

module.exports = authRouter;