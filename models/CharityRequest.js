const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId;
const charityRequestSchema = new Schema({
    charityId: {type: ObjectId, ref: 'Charity', required: true},
    inventory: {type: ObjectId, ref: 'Inventory', required: true},
    donationRequestIds: [{type: ObjectId, ref: 'DonationRequest', required: true}],
    createdDate: {
        type: Date,
        required: true
    }
}, {collection: 'charityRequestCollection'})
module.exports = mongoose.model('CharityRequest', charityRequestSchema)
