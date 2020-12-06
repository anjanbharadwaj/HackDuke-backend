const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Charity = require('../models/Charity');
const Restaurant = require('../models/Restaurant');
const Inventory = require('../models/Inventory');

const saltRounds = 10;

const secretKey = "hackdukeisamazing"

router.use('/request', verifyAuthToken)

router.route('/request')
    .post((req, res) => {
        console.log("generating charity request")
        // inventory = req.inventory
        charity = req.charity
        console.log(charity)
        let createdDate = new Date();
        let charityId = charity.uid
        console.log(charityId)
        let donationRequests = getDreamInventory(charityId)
        
    }
)

function verifyAuthToken(req, res, next) {
    const tokenStr = req.headers['authorization']
    if (tokenStr) {
        const authToken = tokenStr.split(' ')[1]
        console.log(authToken)
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



function getDreamInventory(charityId) {
    console.log(charityId)
    let foundCharity = Charity.findById(charityId).populate({
        path: 'dreamInventory'
    }).exec(function(err, charity) {
        console.log(charity);
        console.log('Found dream inventory: ', charity.dreamInventory);
        let arr = charity.dreamInventory.foodTypeWrapperIds;
        for (let i = 0; i < arr.length; i++) {
            console.log(arr[i].amount)
        }
        
    });
    // return foundCharity;
}

function generateDonationRequests(dreamFoodWrappers, currentFoodWrappers) {
    let dreamInventory = getDreamInventory(charityId);
}

module.exports = router

