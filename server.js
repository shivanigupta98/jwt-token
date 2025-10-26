require('dotenv').config();
const express = require('express');
const app = express();
const authRouter = require('./router/auth')
const userRouter = require("./router/user");
const cookieParser = require('cookie-parser');
const connectDb = require('./config/dbConnect');
const PORT = process.env.port || 8000;

app.use(express.json());
app.use(cookieParser());
app.use("/", authRouter);
app.use("/", userRouter)

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

connectDb().then(() => {
    console.log('DB Connected');
    app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    })
})
    .catch((err) => {
        console.error('DB connection failed:', err.message);
        process.exit(1);
    });

