const mongoose = require("mongoose");

const CounterSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    seq: {
        type: Number,
        required: true
    }
});

const Counter = mongoose.model('Counter', CounterSchema);

const getSequenceNextValue = async (seqName) => {
    try {

        const findSeqName = await Counter.findById(seqName);

        if (!findSeqName) {
            const newCounter = await Counter.create({ _id: seqName, seq: 1 });
            return 1;
        }
        else {
            const updateData = await Counter.findByIdAndUpdate(seqName, { "$inc": { "seq": 1 } }, { new: true });
            return updateData.seq
        }
    } catch (error) {
        return error;
    }
};

module.exports = {
    Counter,
    getSequenceNextValue,
}