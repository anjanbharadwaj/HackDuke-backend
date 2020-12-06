const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId;
const donationRequestSchema = new Schema({
    status: {
        type: Boolean,
        required: true,
        default: true
    },
    amountLeft: {
        type: Number,
        required: true
    },
    foodTypeId: {type: ObjectId, ref: 'FoodType', required: true},
    givenDonationIds: [{type: ObjectId, ref: 'GivenDonation', required: true}]
}, {collection: 'donationRequestCollection'})
module.exports = mongoose.model('DonationRequest', donationRequestSchema)
