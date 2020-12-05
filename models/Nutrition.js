const mongoose = require('mongoose')
var Float = require('mongoose-float').loadType(mongoose);

const Schema = mongoose.Schema
const nutritionSchema = new Schema({
    protein: {
        type: Float,
        required: false
    },
    carbohydrates: {
        type: Float,
        required: false
    },
    fat: {
        type: Float,
        required: false
    },
    calories: {
        type: Float,
        required: false
    },
    vitamins: {
        type: [String],
        required: false
    }
}, {collection: 'foodCollection'})
module.exports = mongoose.model('Nutrition', nutritionSchema)
