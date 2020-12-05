const mongoose = require('mongoose')
const Schema = mongoose.Schema
const Nutrition = require('./Nutrition');
const foodTypeSchema = new Schema({
    name: {
        type: String,
        required: false
    },
    group: {
        type: String,
        required: true
    },
    perishable: {
        type: Boolean,
        required: true,
        default: false
    },
    nutrition: {
        type: Nutrition,
        required: false
    }
}, {collection: 'foodCollection'})
module.exports = mongoose.model('FoodType', foodTypeSchema)
