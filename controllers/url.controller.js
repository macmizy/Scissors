const Url = require("../models/url.model");
const Analytics = require("../models/analytics.model");
const User = require("../models/user.model");
const uaParser = require("ua-parser-js");
const geoip = require("geoip-lite");
const qrcode = require('qrcode');
const redis = require('redis');
const redisClient = redis.createClient();


async function genrateshortUrl() {
    try{

        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let urlId = '';

        for (let i = 0; i < 7; i++) {
            urlId += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        const checkUrlId = await Url.findOne({ shortUrl: urlId });

        if(checkUrlId){
            genrateshortUrl();
        }

        return urlId;
    }
    catch (error) {
        console.log(error);
        return false;
    }
};

async function extractAnalyticsData(req) {

    try{

        const ua = uaParser(req.headers['user-agent']);
        const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const country = geoip.lookup(ipAddress);
  
        return {
            ip: ipAddress,
            country: country ? country.country : 'Unknown',
            os: ua.os.name,
            browser: ua.browser.name,
            device: ua.device.type,
        }
    } catch (error) {
        console.log(error);
        return false;
    }
};

const generalShort = async (req, res) => {

    const { longUrl } = req.body;

    const urlId = await genrateshortUrl();

    if(!urlId){
        return res.status(400).json({
            success: false,
            error: "Something went wrong, please try again."
        })
    }

    const url = await Url.create({
        longUrl: longUrl,
        shortUrl: urlId,
    })

    res.status(200).json({
        success: true,
        urlId: urlId
    })
};

const loggedinShort = async (req, res) => {
    try {

        const { longUrl, customUrl } = req.body;
        const urlId = '';
        // check if the customUrl exists in the database

        if (customUrl) {
          const existingLink = await Url.findOne({ customUrl: customUrl });
          if (existingLink) {
            return res.status(400).json({ error: 'Custom URL already taken' });
          }
        }
        
    

        if (!longUrl) {
            return res.status(400).json({
                success: false,
                error: "Please enter original url"
            })
        }
         

        if(!customUrl){
            urlId = await genrateshortUrl();
        }
            
        
        const url = await Url.create({
            longUrl: longUrl,
            shortUrl: urlId,
            owner: req.user._id,
            customUrl: customUrl,
            createdAt: Date.now()
        })

        const analytic = await Analytics.create({
            url: url._id,
            user: req.user._id,
            shortUrl: url.shortUrl,
            createdAt: Date.now()
        })
        const user = await User.findById(req.user._id);

        url.analytics = analytic._id;
        await url.save();

        user.urls.push(url._id);
        await user.save();


        res.status(200).json({
            success: true,
            message: "Url created successfully",
            url: url,
        })
    }catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        })
    }
};

const getUrl = async (req, res) =>  {
    try {

        const { urlId } = req.params;

        if(!urlId){
            return res.redirect('/');
        }

        const url = await Url.findOne ({
            $or: [
                {shortUrl: urlId},
                {customUrl: urlId}
            ],
        })
    
        if (!url){
            res.status(404).json({
                status: false,
                error: 'Url not found'
            })
        }
        if(!url.owner){
            return res.redirect(url.longUrl);
        }
        const analytic = await Analytics.findById(url.analytics);
        analytic.clicks++;
        const analyticsData = extractAnalyticsData(req);

        analytic.os.push(analyticsData.os);
            
        analytic.browser.push(analyticsData.browser);
        analytic.device.push(analyticsData.device);
        analytic.ip.push(analyticsData.ip);
        analytic.country.push(analyticsData.country);

        await analytic.save();
        return res.redirect(url.longUrl);
    }catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        })
    }
};

const getMyUrls = async(req, res) => {
    try {
        const urls = await Url.find({ owner: req.user._id }).select("longUrl shortUrl customUrl createdAt");
        // Return the links with analytics data
        res.status(200).json(urls.reverse());
    } catch (error) {
        res.status(500).json({ error: 'An error occurred' });
    }

};

const getAnalytics = async(req, res) => {
    try{

        const { urlId } = req.params;

        const url = await Url.find({ shortUrl: urlId, owner: req.user._id }).populate('analytics');
        if(!url){
            return res.status(404).json({
                success: false,
                error: "Url not found"
            })
        }

        res.status(200).json({
            success: true,
            message: "Url fetched successfully",
            url
        })

    }
    catch(error){
        res.status(400).json({
            success: false,
            error: error.message
        })
    }
}

module.exports = {
    generalShort,loggedinShort,getUrl,getMyUrls,getAnalytics
}