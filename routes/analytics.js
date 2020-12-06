const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Charity = require('../models/Charity');
const Restaurant = require('../models/Restaurant');


/*
Analytics Page (charity)
    Total lbs of donations received
    Total # of restaurants donated from
    List of restaurants they received the most from
    Line chart showing monthly donation amounts
        Maybe even split by food group
	How much “Methane” or whatever they saved based on the pounds of waste they donated

getDonations: (returns a list of GivenDonations)
    loop through all CharityRequests
        loop through all donationRequests
            loop through all given donations

totalReceived(GivenDonations): (returns total lbs received)

totalReceived(GivenDonations, Date): (returns total lbs received on that date)

poundsToEmissions(pounds food): (returns amount of emissions saved)

topRestaurants(int k, GivenDonations): (returns top k restaurants donations have been received from)

lineChartData(GivenDonations): (returns a list of (date, donations received in amounts))


Analytics Page (restaurant)
    Approximate monetary value of donations
    Approximate environmental impact
    Total lbs of donations made
    Total # of charities donated to
    List of charities they donated most to
    Line chart showing monthly donation amounts
    Maybe even split by food group


*/


const saltRounds = 10;

const secretKey = "hackdukeisamazing"

router.use('/charity_analytics', verifyAuthToken)
router.use('/restaurant_analytics', verifyAuthToken)
// can access the charity by doing req.charity

router.route('/charity_analytics')
    .post((req, res) => {
        console.log("generating charity analytics");
        res.status(200).json({message: poundsToEmissions(req.body.givenDonations)});
    }
)

router.route('/restaurant_analytics')
    .post((req, res) => {
        console.log("generating restaurant analytics");
        res.status(200).json({message: totalRestaurantDonations(req.body.givenDonations)});
    }
)

// RESTAURANT ANALYTICS

function getRestaurantDonations(givenDonations, restaurant_id) {
    out = [];

    for (donation of givenDonations) {
        if (donation["restaurant_id"] === restaurant_id) {
            out.push(donation);
        }
    }

    return out;
}


function restaurantEnvironmentalImpact(restaurantDonations) {
    return poundsToEmissions(restaurantDonations);
}


function totalRestaurantDonations(restaurantDonations) {
    return totalReceived(restaurantDonations);
}


function charitiesDonatedTo(k, restaurantDonations) {
    if (k === -1) {
        k = restaurantDonations.length;
    }

    let charities = {};

    for (let donation of restaurantDonations) {
        if (charities.hasOwnProperty(donation["charity_id"])) {
            charities[donation["restaurant_id"]] += donation["donation_amount"];
        } else {
            charities[donation["restaurant_id"]] = donation["donation_amount"];
        }
    }

    let sortable = [];

    for (let charity in charities) {
        sortable.push([charity, charities[charity]]);
    }

    sortable.sort(function(a, b) {
        return -(a[1] - b[1]);
    });

    return sortable.slice(0, Math.min(k, sortable.length));
}


function restaurantLineChartData(restaurantDonations) {
    return lineChartData(restaurantDonations);
}



// CHARITY ANALYTICS

function getDonations(){
  var totalDonations = []
  email = "charity2@gmail.com"
  Charity.findOne({ email: email}, function (err, charity) {
      if (err) {
        console.log(err);
      } else {
          charityReq = charity.CharityRequests;
          for(var i = 0; i < charityReq.length; i++){
            CharityRequests.findOne({CharityRequests : charityReq[i].charityId}, function(err, ch_req){
              if(err){
                console.log(err);
              }else{
                donationReq = ch_req.DonationRequests;
                for(var j = 0; j < donationReq.length; j++){
                  DonationRequests.findOne({DonationRequests: donationReq[j].id}, function(err, d_r){
                    givenDonations = d_r.GivenDonation;
                    for(var k = 0; k < givenDonations.length; k++){
                      totalDonations.push(givenDonations[k]);
                    }
                  })
                }
              }
            })
          }
      }
  })

  return totalDonations;
}


function totalReceived(givenDonations){
  var total_ibs = 0;
  console.log("Given Donations length: " + givenDonations.length)
  for(var i = 0; i < givenDonations.length; i++){
    var currJson = givenDonations[i];
    total_ibs += currJson.donation_amount;
  }
  return total_ibs;
}


function totalReceived(givenDonations, date){
  var total_ibs = 0;
  for(var i = 0; i < givenDonations.length; i++){
    var currJson = givenDonations[i];
    if(!dateSame(date, currJson.date)) continue;
    total_ibs += currJson.amount_donated;
  }
  return total_ibs;
}


// I'm assuming here that date is a string
function dateSame(date, date2){
  console.log("Comparing " + date + " with " + date2);
  return date == date2;
}


function topRestaurants(k, givenDonations) {
    let restaurants = {};

    for (let donation of givenDonations) {
        if (restaurants.hasOwnProperty(donation["restaurant_id"])) {
            restaurants[donation["restaurant_id"]] += donation["donation_amount"];
        } else {
            restaurants[donation["restaurant_id"]] = donation["donation_amount"];
        }
    }

    let sortable = [];

    for (let restaurant in restaurants) {
        sortable.push([restaurant, restaurants[restaurant]]);
    }

    sortable.sort(function(a, b) {
        return -(a[1] - b[1]);
    });

    return sortable.slice(0, Math.min(k, sortable.length));
}


function lineChartData(givenDonations) {
    let sortable = [];
    let currDate;
    let currAmount = 0;

    if (givenDonations.length > 0) {
        currDate = givenDonations[0]["date"];
    }

    for (let donation of givenDonations) {
        if (donation["date"] == currDate) {
            currAmount += donation["donation_amount"];
        } else {
            sortable.push([currDate, currAmount]);
            currDate = donation["date"];
            currAmount = donation["donation_amount"];
        }
    }

    if (currDate != null) {
        sortable.push([currDate, currAmount]);
    }

    sortable.sort(function(a, b) {
        return Date.parse(a[0]) - Date.parse(b[0]);
    })

    return sortable;
}


// http://css.umich.edu/factsheets/carbon-footprint-factsheet
function poundsToEmissions(givenDonations) {
    let total = 0;
    for (let donation of givenDonations) {
        delta = donation["donation_amount"];
        if (donation["food_type"]["food_group"] === "protein") {
            total += 6.61 * 16 * delta / 4;
        } else if (donation["food_type"]["food_group"] === "dairy") {
            total += 2.45 * 16 * delta / 4;
        } else if (donation["food_type"]["food_group"] === "vegetables") {
            total += 0.005 * 16 * delta / 4;
        } else if (donation["food_type"]["food_group"] === "grain") {
            total += 0.016 * 16 * delta / 4;
        }
    }

    return total;
}


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

module.exports = router
