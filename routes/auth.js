const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Charity = require('../models/Charity');
const Restaurant = require('../models/Restaurant');
const ObjectId = mongoose.Types.ObjectId;
const multiparty = require("multiparty");
const saltRounds = 10;
const utils = require('./ParseModules');

const secretKey = "hackdukeisamazing"

router.use('/user', verifyAuthToken)
router.route('/user')
    .get(async (req, res) => {
        console.log(req.user);

        Charity.findOne(req.user.id, function (err, charity) {
            if (err) {
                Restaurant.findOne(req.user.id, function (err, restaurant) {
                    if (err) {
                        return res.sendStatus(404)
                    } else {
                        return res.status(200).json(restaurant)
                        console.log(restaurant);
                    }
                })
            } else {
                return res.status(200).json(charity)
            }
        })
        
    })



function verifyAuthToken(req, res, next) {
    const tokenStr = req.headers['authorization']
    if (tokenStr) {
        const authToken = tokenStr.split(' ')[1]
        console.log(authToken)
        jwt.verify(authToken, secretKey, (err, user) => {
            if (err) {
              return res.sendStatus(403)
            } 
            req.user = user
            next() 
          })
    } else {
        return res.sendStatus(403)
    }
}

router.route('/register')
    .post(async (req, res) => {
        console.log("requested register")
        const usertype = req.query.usertype
        console.log("type: " + usertype)
        if (usertype == "charity") {
            console.log("requested charity register")
            let form = new multiparty.Form();
            form.parse(req, async (err, fields, files) => {
                console.log("fields")
                console.log(fields)
                console.log("email")
                console.log(fields['email'][0])
                Charity.findOne({ email: fields['email'][0]}, function (err, charity) {
                    if (err) {
                        console.log("err1")
                        res.status(400).json({error: err})
                    } else {
                        if (charity) {
                            console.log("err2: existing")
                            res.status(400).json({error: err})
                            // already exists
                        } else {

                            
                            bcrypt.hash(fields['password'][0], saltRounds, async function(err, hashedPassword) {
                                if (err) {
                                    console.log("encryption failed")
                                    res.status(400).json({error: err, message: "encryption error"})
                                }
                                else {
                                    await completeRegisterCharity(files, fields, hashedPassword, res);
                                    
                                }
                            })
                            
                        }
                    }
                });
            });
            
    
    
        } else {
            Restaurant.findOne({ email: req.body.email}, function (err, restaurant) {
                if (err) {
                    res.status(400).json({error: err})
                } else {
                    if (restaurant) {
                        res.status(400).json({error: err})
                        // already exists
                    } else {
                        bcrypt.hash(req.body.password, saltRounds, function(err, hashedPassword) {
                            if (err) {
                                res.status(400).json({error: err, message: "encryption error"})
                            }
                            else {
                                const restaurant = new Restaurant({
                                    name: req.body.name,
                                    email: req.body.email,
                                    password: hashedPassword,
                                    location: {
                                        type: "Point",
                                        coordinates: [req.body.longitude, req.body.latitude]
                                    },
                                    donationBatches: []
                                })
                                
                                restaurant.save((err)=>{
                                    if (err){
                                        res.status(400).json({error: err, message: "save error"})
                                    }else{
                                        res.status(200).json({message: "success"})
                                    }
                    
                                });
                            }
                        })
                        
                    }
                }
            });
    
        }
        
      
    }
)

router.route('/login')
    .post((req, res) => {
        console.log("requested login")
        const password = req.body.password
        const email = req.body.email
        loginCharity(email, password, res)
    }
)

function loginCharity(email, password, res) {
    Charity.findOne({ email: email}, function (err, charity) {
        if (err) {
            loginRestaurant(email, password, res)
        } else {
            if (charity) {
                hashedPassword = charity.password
                bcrypt.compare(password, hashedPassword, function(err, correct) {
                    if (err) {
                        loginRestaurant(email, password, res)
                    } else {
                        if (correct) {
                            jwt.sign({uid: charity.id}, secretKey, (err, token) => {
                                console.log(charity)
                                res.status(200).json({message: "success", token: token, type: "charity"})
                            })
                        } else {
                            loginRestaurant(email, password, res)
                        }
                    }
                });
            } else {
                loginRestaurant(email, password, res)
            }
        }
    });
    
}

function loginRestaurant(email, password, res) {
    console.log("loginRestaurant a")
    Restaurant.findOne({ email: email}, function (err, restaurant) {
        if (err) {
            res.status(400).json({error: err})
        } else {
            if (restaurant) {
                hashedPassword = restaurant.password
                bcrypt.compare(password, hashedPassword, function(err, correct) {
                    if (err) {
                        res.status(400).json({error: err})
                    } else {
                        if (correct) {
                            jwt.sign({uid: restaurant.id}, secretKey, (err, token) => {
                                res.status(200).json({message: "success", token: token, type: "restaurant"})
                            })
                        } else {
                            res.status(401).json({error: "Incorrect Password!"})
                        }
                    }
                });
            } else {
                res.status(401).json({error: "Incorrect Email!"})
            }
        }
    });
    
}

function createInventory() {

}


async function completeRegisterCharity(files, fields, hashedPassword, res){
    
    console.log("SUCCESS FILE FOUND")
        console.log(fields)
        let dreamInventory = await utils.parsing(files["inventory"][0].path);
        // console.log("SUCCESS FILE FOUND")
        // console.log(dreamInventory)
        const charity = new Charity({
            name: fields['name'][0],
            email: fields['email'][0],
            password: hashedPassword,
            location: {
                type: "Point",
                coordinates: [fields['longitude'][0], fields['latitude'][0]]
            },
            dreamInventory: dreamInventory._id,
            charityRequestIds: []
        })

        charity.save((err)=>{
            if (err){
                console.log("save failed")
                res.status(400).json({error: err, message: "save error"})
            }else{
                res.status(200).json({message: "success"})
            }
    
        });
    
}

module.exports = router
