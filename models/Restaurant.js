const mongoose = require('mongoose')
var Float = require('mongoose-float').loadType(mongoose);
const Schema = mongoose.Schema
const restaurantSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    latitude: {
        type: Float,
        required: true
    },
    longitude: {
        type: Float,
        required: true
    },
    donationBatches: {
        type: [{type: ObjectId, ref: 'DonationBatch'}],
        required: true
    },
}, {collection: 'restaurantCollection'})
module.exports = mongoose.model('Restaurant', restaurantSchema)


// id
// Dream_inventory: Inventory
// CharityRequests: [ req1, req2]
// Name
// Email
// Password
// Location/Address
