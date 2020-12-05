const mongoose = require('mongoose')
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
    locationAddress: {
        type: String,
        required: true
    }
}, {collection: 'restaurantCollection'})
module.exports = mongoose.model('Restaurant', restaurantSchema)


// id
// Dream_inventory: Inventory
// CharityRequests: [ req1, req2]
// Name
// Email
// Password
// Location/Address
