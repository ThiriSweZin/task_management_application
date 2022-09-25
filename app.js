/**
 * Main Application
 */
const express = require('express')
const bodyParser = require('body-parser')

const app = express()
const port = process.env.PORT || 3060 

// static Files
app.use(express.static('public'))
app.use('/css', express.static(__dirname + 'public/css'))
app.use('/img', express.static(__dirname + 'public/img'))
app.use('/js', express.static(__dirname + 'public/js'))

var app = require('./dist/app');
module.exports = app.default;