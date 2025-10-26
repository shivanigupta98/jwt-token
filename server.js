require('dotenv').config();
const express = require('express');
const app = express();
const authRouter = require('./router/auth')
const userRouter = require("./router/user");
const cookieParser = require('cookie-parser');
const connectDb = require('./config/dbConnect');


app.use(express.json());
app.use(cookieParser());
app.use("/", authRouter);
app.use("/", userRouter)

connectDb().then(() => {
    console.log('DB Connected');
    app.listen('8000', () => {
        console.log(`Server listening on port 8000`);
    })
})

