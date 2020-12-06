const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Charity = require('../models/Charity');
const Restaurant = require('../models/Restaurant');
const Inventory = require('../models/Inventory');
const DonationRequest = require('../models/DonationRequest');
const CharityRequest = require('../models/CharityRequest');
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId;
const lodash = require('lodash')
const utils = require('./ParseModules');

const multiparty = require("multiparty");

const saltRounds = 10;

const secretKey = "hackdukeisamazing"

router.use('/request', verifyAuthToken)

router.route('/request')
    .post(async (req, res) => {
        console.log("generating charity request")
        let form = new multiparty.Form();

        form.parse(req, async (err, fields, files) => {
            let currentInventory = await utils.parsing(files["inventory"][0].path);
            charity = req.charity
            console.log("CURRENT INVENTORY: ")
            console.log(currentInventory)
            let createdDate = new Date();
            let charityId = charity.uid
            let donationRequests = getDreamInventory(charityId, currentInventory)
        });
        
        
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


function getDreamInventory(charityId, currentInventory) {
    console.log(charityId)
    let foundCharity = Charity.findById(charityId).populate({
        path: 'dreamInventory'
    }).exec(function(err, charity) {
        // console.log(charity);
        console.log('Found dream inventory: ', charity.dreamInventory);
        let arr = charity.dreamInventory.foodTypeWrapperIds;
        let arr2 = currentInventory.foodTypeWrapperIds;
 
        generateDonationRequests(charity, charityId, arr, arr2, currentInventory);
    });
    // return foundCharity;
}

async function generateDonationRequests(charity, charityId, dreamFoodWrappers, currentFoodWrappers, currentInventory) {
    let dreamMap = new Map()
    let currMap = new Map()
    for (let i = 0; i < dreamFoodWrappers.length; i++) {
        let foodTypeWrapper = dreamFoodWrappers[i];
        let dreamFoodTypeId = foodTypeWrapper.foodTypeId 
        let dreamAmount = foodTypeWrapper.amount
        dreamMap.set(""+dreamFoodTypeId, dreamAmount)
    }
    for (let i = 0; i < currentFoodWrappers.length; i++) {
        let foodTypeWrapper = currentFoodWrappers[i];
        let currentFoodTypeId = foodTypeWrapper.foodTypeId 
        let currentAmount = foodTypeWrapper.amount
        currMap.set(""+currentFoodTypeId, currentAmount)
    }

    console.log("TESTS")
    console.log(dreamMap.constructor.name)
    // dreamMap.entries.next()
    let differences = new Map()

    for (const [key, value] of dreamMap.entries()) {
        console.log(key.constructor.name)
        
        let difference = value;
        if (currMap.has(key)) {
            console.log("Overlap")
            difference -= currMap.get(key)
        }
        if (difference > 0) {
            differences.set(key, difference)
        }
    }
    console.log("DIFFERENCES: ")
    console.log(differences)
    let charityRequest = new CharityRequest({
        donationRequestIds: [],
        charityId: charityId,
        inventory: currentInventory,
        createdDate: new Date()
    })
    for(const [key, value] of differences.entries()){
        let donationReq = new DonationRequest({
            status: true,
            amountLeft: value,
            foodTypeId: mongoose.Types.ObjectId(key),
            givenDonation: []
        })
        await donationReq.save()
        charityRequest.donationRequestIds.push(donationReq._id)
    }

    await charityRequest.save();
    charity.charityRequestIds.push(charityRequest._id)
    charity.save();

}




module.exports = router

