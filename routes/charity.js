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
const FoodType = require("../models/FoodType")

const multiparty = require("multiparty");
const { request } = require('express');

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
            let donationRequests = getDreamInventory(charityId, currentInventory, res)
            res.status(200).json({message: "success"});
        });
    }
    )

router.route('/latest_request')
    .get(async (req, res) => {
        console.log(req);
        const { id } = req.query;

        console.log(id);
        Charity.find({_id: id}).populate("charityRequestIds").exec(function(err,data) {
            if (err) return handleError(err);

            let arr = data[0].charityRequestIds
            // console.log("arr")
            // console.log(arr)
            arr.sort(function (a, b) {
                // Turn your strings into dates, and then subtract them
                // to get a value that is either negative, positive, or zero.
                // console.log()
                return new Date(b.createdDate) - new Date(a.createdDate);
            });
            let bestCharityRequest = arr[0]
            CharityRequest.find({_id: bestCharityRequest._id}).populate('donationRequestIds').exec(async function(err, charityReq) {
                if (err) res.status(400).json();
                console.log("FINAL: ");
                let groupAmountMap =new Map();
                let temp = charityReq[0]["donationRequestIds"]
                for (let i = 0; i < temp.length; i++) {
                    let donation = temp[i]
                    console.log(donation.amountLeft);
                    console.log(donation.foodTypeId);
                    console.log(donation._id);
                    console.log(donation.givenDonationIds)
                    let out = await FoodType.findById(donation.foodTypeId).exec();
                    console.log(donation)
                    let objj = await DonationRequest.find({_id: donation._id}).populate('givenDonationIds').exec();
                    console.log("boo");
                    console.log(objj);

                    console.log(objj[0]);
                    groupAmountMap.set(out.group, (new Map).set("amount", donation.amountLeft).set("givenDonationIds", objj[0].givenDonationIds));
                    console.log("boo");
                    console.log(groupAmountMap);

                }
                return res.status(200).json(groupAmountMap);
            });

        });



        // Charity
        //     .find({ _id: id })
        //     .populate({
        //     path:     'charityRequestIds',
        //     populate: { path:  'donationRequestIds',
        //             model: 'DonationRequest' }
        //     })
        //     .exec(function(err, data){
        //         if (err) return handleError(err);
        //         console.log(data)
        //         data.sort(function (a, b) {
        //             // Turn your strings into dates, and then subtract them
        //             // to get a value that is either negative, positive, or zero.
        //             return new Date(b.createdDate) - new Date(a.createdDate);
        //         });

        //         let best = data[0]

        //         return res.status(200).json({ request: data[0] })
        //     });


        // Charity.findOne({ _id: id }, async function (err, charity) {
        //     if (err) {
        //         console.log(err);
        //         return res.sendStatus(403)
        //     } else {
        //         console.log(charity.charityRequestIds);


        //         let requests = [];
        //         for (let reqId of charity.charityRequestIds) {
        //             let result = await getRequest(reqId);
        //             console.log(result);
        //             if (result) {
        //                 console.log(result);
        //                 requests.push(result);
        //             }
        //         }
        //         requests.sort(function (a, b) {
        //             // Turn your strings into dates, and then subtract them
        //             // to get a value that is either negative, positive, or zero.
        //             return new Date(b.createdDate) - new Date(a.createdDate);
        //         });

        //         return res.status(200).json({ request: requests[0] })
        //     }
        // })
    });

router.route('/requests')
    .get(async (req, res) => {

        const { id } = req.body;
        Charity.findOne({ _id: id }, async function (err, charity) {
            if (err) {
                console.log(err);
                return res.sendStatus(403)
            } else {
                console.log(charity.charityRequestIds);
                let requests = [];
                for (let reqId of charity.charityRequestIds) {
                    let result = await getRequest(reqId);
                    console.log(result);
                    if (result) {
                        console.log(result);
                        requests.push(result);
                    }
                }
                return res.status(200).json({ requests })
            }
        })

    });


async function getRequest(id) {
    return await CharityRequest.findOne({ _id: id }, function (err, request) {
        if (err) {
            return res.sendStatus(403)
        } else {
            // console.log(request);
            return request;
        }
    }).exec();
}




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


function getDreamInventory(charityId, currentInventory, res) {
    console.log(charityId)
    let foundCharity = Charity.findById(charityId).populate({
        path: 'dreamInventory'
    }).exec(function(err, charity) {

        if (err) {
            return res.sendStatus(403);
        }

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
        dreamMap.set("" + dreamFoodTypeId, dreamAmount)
    }
    for (let i = 0; i < currentFoodWrappers.length; i++) {
        let foodTypeWrapper = currentFoodWrappers[i];
        let currentFoodTypeId = foodTypeWrapper.foodTypeId
        let currentAmount = foodTypeWrapper.amount
        currMap.set("" + currentFoodTypeId, currentAmount)
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
    for (const [key, value] of differences.entries()) {
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


function mapToJSON(map) {
    let out = "{"
    for(let key of map.keys()){
        let getVal = map.get(key);
        if(getVal.constructor.name == "Map") {
            getVal = mapToJSON(getVal);
        }
        if (getVal.length != null && getVal.length === 0) {
            getVal = "null";
        }
        out += "\"" + key + "\": " + getVal + ",";
    }
    out = out.substr(0, out.length - 1);
    out += "}";
    return out;
}



router.route('/specific-donation-request')
    .get(async (req, res) => {
        const { id, food_type_id } = req.body;
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
        let lst = charityReq.donationRequestIds
        if (lst.length <= 0) {
            res.status(400).json();
        }
        donation_Req = lst[0]
        return donation_Req
    });


module.exports = router
