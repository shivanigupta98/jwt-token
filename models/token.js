const mongoose = require('mongoose');

const token = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    refreshToken: {
        type: String,
        required: true
    },
    revoked: {
        type: Boolean,
        required: true,
        default: false
    },
    createdAt: {
        type: Date, default: Date.now
    },

})

module.exports = mongoose.model("Token", token);