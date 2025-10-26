const mongoose = require('mongoose');

const CONNECTION_STRING = process.env.MONGO_URI;

const connectDb =async ()=>{
await mongoose.connect(CONNECTION_STRING);
}

module.exports = connectDb;