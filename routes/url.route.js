const express = require('express');
const urlRouter = express.Router();

const controller = require('../controllers/url.controller');
const passport = require('passport');

urlRouter.post("/api/url", controller.generalShort); 
urlRouter.post("/api/url/v1" , controller.loggedinShort);
urlRouter.get("/:urlId", controller.getUrl);
urlRouter.get("/api/urls", controller.getMyUrls);
urlRouter.get("/api/view/:urlId", controller.getAnalytics);


module.exports = urlRouter  