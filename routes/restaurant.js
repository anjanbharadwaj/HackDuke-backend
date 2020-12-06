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
const DonationBatch = require('../models/DonationBatch');

const FoodType = require('../models/FoodType');

const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId;
const lodash = require('lodash')
const utils = require('./ParseModulesRestaurant');

const multiparty = require("multiparty");
const GivenDonation = require('../models/GivenDonation');

const saltRounds = 10;

const secretKey = "hackdukeisamazing"

router.use('/donate', verifyAuthToken)
router.use('/approved', verifyAuthToken)
router.use('/donationbatches', verifyAuthToken)

router.route('/donate')
    .post(async (req, res) => {
        console.log("generating restaurant donation")
        let form = new multiparty.Form();
        form.parse(req, async (err, fields, files) => {
            let json_out = await utils.parsing(files["inventory"][0].path);
            restaurant = req.restaurant
            // console.log("CURRENT JSON: ")
            // console.log(json_out)
            // console.log("restaurant: ")
            // console.log(restaurant)
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

async function grabCharityRequests(restaurantId, restaurant, fields, json_out, res) {
    // can eventually get SPLITS from fields
    // db.charityCollection.createIndex({ location: '2dsphere' })
    Charity.find({
        location: {
         $near: {
          $maxDistance: 100000000,
          $geometry: {
           type: "Point",
           coordinates: restaurant.location.coordinates
          }
         }
        }
       }).find(async (error, results) => {
        if (error) console.log(error);


        let arrOfCharityRequests = []
        for (let i = 0; i < results.length; i++) {
            let thisCharity = results[i]
            let obj = {}
            obj.charity_lat = thisCharity.location.coordinates[1]
            obj.charity_long = thisCharity.location.coordinates[0]
            obj.charity_id = thisCharity.id
            let charity_req = await getLatestCharityRequest(obj.charity_id)
            if (!charity_req){
                continue;
            }
            charity_req = charity_req[0]
            console.log("charity_req")
            console.log(charity_req)
            let donation_reqs = charity_req.donationRequestIds
            let donation_reqs_clean = []
            console.log("donation_reqs")
            console.log(donation_reqs)
            for (let j = 0; j < donation_reqs.length; j++) {
                let reqdirty = donation_reqs[j]
                let reqclean = {}
                let food_type = {}
                let ftid = reqdirty.foodTypeId
                let food = await convertFoodIdToFood(ftid)
                console.log("foodie")
                console.log(food)
                console.log(food[0])
                
                // FoodType.findById(ftid)
                food_type.food_group = food[0].group;
                reqclean.food_type = food_type
                reqclean.amount_left = reqdirty.amountLeft
                donation_reqs_clean.push(reqclean)
                // console.log(donation_reqs_clean)
            }
            obj.donation_requests = donation_reqs_clean
            // food_type.food_group
            arrOfCharityRequests.push(obj)
        }
        let json_restaurant = {
            "restaurant_inventory": json_out,
            "rest_id": restaurantId,
            "max_splits": fields['splits'][0], //make it fields['splits'][0]
            "rest_lat": restaurant.location.coordinates[1],
            "rest_long": restaurant.location.coordinates[0]
        }
        json_restaurant.charity_requests = arrOfCharityRequests;
        console.log(json_restaurant)
        res.json(json_restaurant)
        
       });

    // CharityRequest.find
}

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


async function getLatestCharityRequest(myid, res) {
    console.log("getLatestCharityRequest")
    let data = await Charity.find({_id: myid}).populate("charityRequestIds");
    let arr = data[0].charityRequestIds
    console.log("arr")
    console.log(arr)
    arr.sort(function (a, b) {
        // Turn your strings into dates, and then subtract them
        // to get a value that is either negative, positive, or zero.
        // console.log()
        return new Date(b.createdDate) - new Date(a.createdDate);
    });
    let bestCharityRequest = arr[0]
    if (!bestCharityRequest) {
        return;
    }
    bestCharityRequest = await CharityRequest.find({_id: bestCharityRequest._id}).populate('donationRequestIds');
    console.log("doneLatestCharityRequest")
    return bestCharityRequest
    // console.log(outer);
    // console.log("done getLatestCharityRequest")
    // return outer;
}

async function convertFoodIdToFood(food_id, res) {
    let data = await FoodType.find({_id: food_id});
    console.log("FOOOOOOD")
    // console.log(data);
    return data;
}

async function convertFoodToFoodId(foodGroup) {
    let data = await FoodType.find({group: foodGroup});
    console.log("group")
    console.log(data);
    if (data) {
        return data[0]._id
    }
    return;
}



router.route('/approved')
    .post(async (req, res) => {
        console.log("approved restaurant donation")
        let arr = req.body.out
        console.log(arr, arr.length)
        let dest_arr = [] // add to donation batch
        for (let i = 0; i < arr.length; i++) {
            let dono_info = arr[i]
            let amountChange = dono_info.amount_donated
            let charityId = dono_info.charity_id
            let food_type = dono_info.food_type
            console.log("food_type")
            console.log(food_type)
            let foodId = await convertFoodToFoodId(food_type)
            console.log("foodtypeid")
            console.log(foodId)

            let restaurantId = dono_info.rest_id

            const given_donation = new GivenDonation({
                restaurantId: restaurantId,
                charityId: charityId,
                foodTypeId: foodId,
                donationAmount: amountChange,
                deliveredDate: new Date()
            })
            await given_donation.save();
            let given_donation_id = given_donation._id;
            let donationRequest = await specificDonationRequest(charityId, foodId)
            donationRequest.givenDonationIds.push(given_donation_id);
            donationRequest.amountLeft = donationRequest.amountLeft - amountChange
            if (donationRequest.amountLeft <= 0) {
                donationRequest.status = false;
            }
            await donationRequest.save();
            dest_arr.push(given_donation_id)
        }

        let donoBatch = new DonationBatch({
            givenDonationIds: dest_arr,
            createdDate: new Date()
        });
        await donoBatch.save();
        let r = req.restaurant
        let restaurantId = r.uid
        let actualRestaurant = await Restaurant.findById(restaurantId);
        actualRestaurant.donationBatches.push(donoBatch);
        await actualRestaurant.save();

        console.log("changes made! ")
        res.status(200).json(donoBatch);

    }
)




/*

Given_Donation {
id
Restaurant_id
Charity_id (destination charity)
FoodType 
Donation_amount (amount restaurant donated)
today_Date
}


{
    "out": [
        {
            "amount_donated": 0,
            "charity_id": 1,
            "food_type": "banana",
            "rest_id": 2
        },
        {
            "amount_donated": 11,
            "charity_id": 2,
            "food_type": "banana",
            "rest_id": 2
        },
        {
            "amount_donated": 24,
            "charity_id": 2,
            "food_type": "apple",
            "rest_id": 2
        },
        {
            "amount_donated": 0,
            "charity_id": 2,
            "food_type": "orange",
            "rest_id": 2
        },
        {
            "amount_donated": 4,
            "charity_id": 3,
            "food_type": "banana",
            "rest_id": 2
        },
        {
            "amount_donated": 9,
            "charity_id": 3,
            "food_type": "orange",
            "rest_id": 2
        }
    ]
}
*/

async function specificDonationRequest(id, food_type_id) {
    let data = await Charity.find({_id: id}).populate("charityRequestIds");
    let arr = data[0].charityRequestIds
    arr.sort(function (a, b) {
        // Turn your strings into dates, and then subtract them
        // to get a value that is either negative, positive, or zero.
        // console.log()
        return new Date(b.createdDate) - new Date(a.createdDate);
    });
    let bestCharityRequest = arr[0]
    let charityReq = await CharityRequest.find({_id: bestCharityRequest._id}).populate({
        path: 'donationRequestIds',
        match: { foodTypeId: food_type_id}
    });
    console.log("FINAL: ");
    let lst = charityReq[0].donationRequestIds
    console.log(lst);

    if (lst.length <= 0) {
        return;
    }
    donation_Req = lst[0]
    return donation_Req
}




// router.route('/donationbatches')
//     .post(async (req, res) => {
//         console.log("grabbing all restaurant donation")
//         let form = new multiparty.Form();
//         form.parse(req, async (err, fields, files) => {
//             let json_out = await utils.parsing(files["inventory"][0].path);
//             restaurant = req.restaurant
//             // console.log("CURRENT JSON: ")
//             // console.log(json_out)
//             // console.log("restaurant: ")
//             // console.log(restaurant)
//             let restaurantId = restaurant.uid
//             console.log(restaurantId)
//             let donationRequests = getRestaurant(restaurantId, json_out, fields, res)
//         });
        
        
//     }
// )

router.route('/donationbatches')
    .get(async (req, res) => {
        let restaurant = await Restaurant.findById({ _id: req.restaurant.uid }).populate({
            path:     'donationBatches',			
	        populate: { path:  'givenDonationIds',
            model: 'GivenDonation', 
                populate: { path:  'charityId'} 
            }
        }        
        );
        console.log("restaurant all batches")
        console.log(restaurant)
        console.log(restaurant[0])
        res.json(restaurant);
    });


module.exports = router

