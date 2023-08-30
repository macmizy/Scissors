const express = require('express')
const passport = require('passport')
const validateUser = require('../models/user.validator');  
const controller = require('../controllers/user.controller')

const userRoute = express.Router()


userRoute.post("/signup",validateUser,passport.authenticate('signup', { session: false }),controller.signup)

userRoute.post('/login',passport.authenticate('login',{ successRedirect: '/',failureRedirect: '/login',}),controller.login);

userRoute.get('/allusers', controller.getAllUsers)

module.exports = userRoute