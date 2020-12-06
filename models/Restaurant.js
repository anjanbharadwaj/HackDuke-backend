const mongoose = require('mongoose')
var Float = require('mongoose-float').loadType(mongoose);
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId;

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
    location: {
        type: { type: String },
        coordinates: []
    },
    donationBatches: [{type: ObjectId, ref: 'DonationBatch', required: true}]
}, {collection: 'restaurantCollection'})
restaurantSchema.index({ location: "2dsphere" });

module.exports = mongoose.model('Restaurant', restaurantSchema)


// id
// Dream_inventory: Inventory
// CharityRequests: [ req1, req2]
// Name
// Email
// Password
// Location/Address
