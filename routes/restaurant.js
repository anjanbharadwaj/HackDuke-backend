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
const utils = require('./ParseModulesRestaurant');

const multiparty = require("multiparty");

const saltRounds = 10;

const secretKey = "hackdukeisamazing"

router.use('/donate', verifyAuthToken)

router.route('/donate')
    .post(async (req, res) => {
        console.log("generating restaurant donation")
        let form = new multiparty.Form();
        form.parse(req, async (err, fields, files) => {
            let json_out = await utils.parsing(files["inventory"][0].path);
            restaurant = req.restaurant
            console.log("CURRENT JSON: ")
            console.log(json_out)
            console.log("restaurant: ")
            console.log(restaurant)
            let restaurantId = restaurant.uid
            console.log(restaurantId)
            let donationRequests = getRestaurant(restaurantId, json_out, fields, res)
        });
        
        
    }
)

function getRestaurant(restaurantId, json_out, fields, res) {
    Restaurant.findById(mongoose.Types.ObjectId(restaurantId), function(err, restaurant) {
        if (err || !restaurant) {
            console.log("err1")
            console.log(err)
            console.log(restaurant)
            res.status(400).json({error: err})
        } else {
            grabCharityRequests(restaurantId, restaurant, fields, json_out, res);
        }
    });
}

function grabCharityRequests(restaurantId, restaurant, fields, json_out, res) {
    // db.charityCollection.createIndex({ location: '2dsphere' })
    Charity.find({
        location: {
         $near: {
          $maxDistance: 10000,
          $geometry: {
           type: "Point",
           coordinates: restaurant.location.coordinates
          }
         }
        }
       }).find((error, results) => {
        if (error) console.log(error);
        console.log("DISTTANCEE")
        console.log(results)

        let json_restaurant = {
            "restaurant_inventory": json_out,
            "rest_id": restaurantId,
            "max_splits": 1000,
            "rest_lat": restaurant.location.coordinates[1],
            "rest_long": restaurant.location.coordinates[0]
        }


        // console.log(JSON.stringify(results, 0, 2));
       });

    // CharityRequest.find
}

/*
[ { location: { coordinates: [Array], type: 'Point' },
    charityRequestIds:
     [ 5fcc7ca096e0f9536459c58d,
       5fcc7cb896e0f9536459c595,
       5fcc7cb996e0f9536459c59e,
       5fcc7cb996e0f9536459c5a7,
       5fcc7cba96e0f9536459c5b0,
       5fcc7cbb96e0f9536459c5b9 ],
    _id: 5fcc764bd309966ea75c7dca,
    name: 'praneeth',
    email: 'praneeth@gmail.com',
    password:
     '$2b$10$78/xZwrELpekLJFuhcsWnOpkorDSJCLBX3MmTk6TUazHsD992h9Am',
    dreamInventory: 5fcc764bd309966ea75c7dc6,
    __v: 6 } ]
*/

/*
{
            "charity_id": 3,
            "charity_lat": 89,
            "charity_long" : 120,
            "donation_requests": [
                {
                    "food_type": {
                        "food_group": "banana"
                    },

                    "amount_left": 15
                },
                {
                    "food_type": {
                        "food_group": "orange"
                    },

                    "amount_left": 11
                }
            ]
        }
*/

function verifyAuthToken(req, res, next) {
    const tokenStr = req.headers['authorization']
    if (tokenStr) {
        const authToken = tokenStr.split(' ')[1]
        console.log(authToken)
        jwt.verify(authToken, secretKey, (err, restaurant) => {
            if (err) {
              return res.sendStatus(403)
            } 
            req.restaurant = restaurant
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

