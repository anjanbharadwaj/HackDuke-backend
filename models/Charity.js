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
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    dreamInventory: {type: ObjectId, ref: 'Inventory', required: false},
    charityRequestIds: [{type: ObjectId, ref: 'CharityRequest', required: false}]
}, {collection: 'charityCollection'})

charitySchema.index({ location: "2dsphere" });

module.exports = mongoose.model('Charity', charitySchema, 'charityCollection');
