const express = require('express');
const userRouter = express.Router();
const { validateInput } = require('../utils/validation');
const userAuth = require('../middleware/userAuth');

userRouter.patch('/update', userAuth, async (req, res) => {
    try {
        const isEditAllowed = validateInput(req);
        if (!isEditAllowed) {
            throw new Error('Edit not allowed');
        }
        const loggedInUser = req.user;
        Object.keys(req.body).every(key => loggedInUser[key] = req.body[key]);
        await loggedInUser.save();
        res.json({ message: "Update Successfull", data: loggedInUser });
    }
    catch (err) {
        res.status(400).send("Error Occured: " + err.message);
    }

})

module.exports = userRouter;