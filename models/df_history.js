const mongoose = require('mongoose');

const dfHistorySchema = mongoose.Schema({
    custId: {
        type: String,
        required: true
    },
    assetsId: {
        type: Array,
        required: true
    }
},
{ timestamps: true }
);

module.exports = mongoose.model('dfHistory', dfHistorySchema);