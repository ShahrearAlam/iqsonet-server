const mongoose = require("mongoose");
const { Schema, ObjectId } = mongoose;

const type = Object.freeze({
    text: 'text',
    // people: 'people',
});

const schema = new Schema({
    user: {
        type: ObjectId,
        required: true,
        ref: "user"
    },
    text: {
        type: String,
        required: false,
        default: null,
    },
    type: { 
        type: String, 
        enum: Object.values(type), 
        required: false,
        default: type.text,
    },
}, { timestamps: true });

const model = mongoose.model("search_history", schema);
module.exports = { SearchHistoryModel: model, SearchHistoryType: type };