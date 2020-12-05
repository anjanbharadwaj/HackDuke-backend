const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId;
const givenDonationSchema = new Schema({
    restaurantId: {
        type: {type: ObjectId, ref: 'Restaurant'},
        required: true
    },
    charityId: {
        type: {type: ObjectId, ref: 'Charity'},
        required: true
    },
    foodTypeId: {
        type: {type: ObjectId, ref: 'FoodType'},
        required: true
    },
    donationAmount: {
        type: Number,
        required: true
    },
    deliveredDate: {
        type: Date,
        required: true
    }
}, {collection: 'givenDonationCollection'})
module.exports = mongoose.model('GivenDonation', givenDonationSchema)
