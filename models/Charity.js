const mongoose = require('mongoose')
var Float = require('mongoose-float').loadType(mongoose);
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId;

const charitySchema = new Schema({
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
    dreamInventory: {type: ObjectId, ref: 'Inventory', required: false},
    charityRequestIds: [{type: ObjectId, ref: 'CharityRequest', required: false}]
}, {collection: 'charityCollection'})
module.exports = mongoose.model('Charity', charitySchema)
