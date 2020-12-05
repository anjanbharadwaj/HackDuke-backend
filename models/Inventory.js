const mongoose = require('mongoose')
const Schema = mongoose.Schema
const FoodTypeWrapper = require('./FoodTypeWrapper');
const ObjectId = Schema.Types.ObjectId;
const inventorySchema = new Schema({
    foodTypeWrapperId: {
        type: [{type: ObjectId, ref: 'FoodTypeWrapper'}],
        required: true
    }
}, {collection: 'inventoryCollection'})
module.exports = mongoose.model('Inventory', inventorySchema)
