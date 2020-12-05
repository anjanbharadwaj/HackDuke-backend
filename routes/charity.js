const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Charity = require('../models/Charity');
const Restaurant = require('../models/Restaurant');

const saltRounds = 10;

const secretKey = "hackdukeisamazing"

router.use('/request', verifyAuthToken)

router.route('/request')
    .post((req, res) => {
        console.log("generating charity request")
        inventory = req.inventory
        charity = req.charity
        let createdDate = new Date();
        let charityId = charity._id
        let donationRequests = generateDonationRequests(charityId)
        
    }
)

function verifyAuthToken(req, res, next) {
    const tokenStr = req.headers['authorization']
    if (tokenStr) {
        const authToken = tokenStr.split(' ')[1]
        jwt.verify(authToken, secretKey, (err, charity) => {
            if (err) {
              return res.sendStatus(403)
            } 
            req.charity = charity
            next() 
          })
    } else {
        return res.sendStatus(403)
    }
}

function parseCSV(req, res, next) {
    const inventory = new Object();
    req.inventory = inventory
}

function generateDonationRequests(charityId) {
    let dreamInventory = getDreamInventory(charityId);
}

function getDreamInventory(charityId) {
    let foundCharity = Charity.findById(charityId).populate('dreamInventory').exec();
    console.log('Found dream inventory: ', foundCharity.dreamInventory);
    return foundCharity;
}
module.exports = router
