const mongoose = require('mongoose')
const Schema = mongoose.Schema
const FoodType = require('./FoodType');
const ObjectId = Schema.Types.ObjectId;
const foodTypeWrapperSchema = new Schema({
    foodTypeId: {
        type: {type: ObjectId, ref: 'FoodType'},
        required: true
    },
    amount: {
        type: Number,
        required: true
    }
}, {collection: 'foodCollection'})
module.exports = mongoose.model('FoodTypeWrapper', foodTypeWrapperSchema)
