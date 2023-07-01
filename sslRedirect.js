const express = require('express');
const dotenv = require("dotenv");
dotenv.config();

const sslRedirect = ( status = 302 ) => {

  return ( req, res, next ) => {
    if( process.env.NODE_ENV == 'production' && req.headers["x-forwarded-proto"] !== "https" ){

        res.redirect( status, "https://" + req.hostname + req.originalUrl );

    }else{
        next();
    } 
}};

module.exports = sslRedirect;