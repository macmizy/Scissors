const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema({

longUrl: {
    type: String,
    required: true
},
shortUrl: {
    type: String,
},
customUrl: {
    type: String,
    unique: true,
},
owner:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
},
analytics:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Analytics',
},
createdAt: {
    type: Date,
},
});

const UrlModel = mongoose.model('Url', urlSchema)

module.exports = UrlModel