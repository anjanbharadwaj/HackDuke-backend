const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Charity = require('../models/Charity');
const Restaurant = require('../models/Restaurant');

const saltRounds = 10;

const secretKey = "hackdukeisamazing"

router.route('/register')
    .post((req, res) => {
        console.log("requested register")
        const usertype = req.query.usertype
        console.log("type: " + usertype)
        if (usertype == "charity") {
            console.log("requested charity register")
            Charity.findOne({ email: req.body.email}, function (err, charity) {
                if (err) {
                    console.log("err1")
                    res.status(400).json({error: err})
                } else {
                    if (charity) {
                        console.log("err2: existing")
                        res.status(400).json({error: err})
                        // already exists
                    } else {
                        bcrypt.hash(req.body.password, saltRounds, function(err, hashedPassword) {
                            if (err) {
                                console.log("encryption failed")
                                res.status(400).json({error: err, message: "encryption error"})
                            }
                            else {
                                const charity = new Charity({
                                    name: req.body.name,
                                    email: req.body.email,
                                    password: hashedPassword,
                                    locationAddress: req.body.locationAddress
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
                        })
                        
                    }
                }
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
                                    locationAddress: req.body.locationAddress
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

module.exports = router
