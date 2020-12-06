const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId;
const donationBatchSchema = new Schema({
    createdDate: {
        type: Date,
        required: true
    },
    givenDonationIds: [{type: ObjectId, ref: 'GivenDonation', required: true}]
}, {collection: 'donationBatchCollection'})
module.exports = mongoose.model('DonationBatch', donationBatchSchema)
