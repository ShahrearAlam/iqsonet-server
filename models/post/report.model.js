const mongoose = require("mongoose");
const { Schema, ObjectId } = mongoose;

const reportType = Object.freeze({
    nudity: 'nudity',
    violence: 'violence',
    suicide_or_self_injury: 'suicide_or_self_injury',
    false_information: 'false_information',
    spam: 'spam',
    unauthorized_sale: 'unauthorized_sale',
    hate_speech: 'hate_speech',
    terrorism: 'terrorism',
    something_else: 'something_else',
});

const schema = new Schema({
    reportedPost: {
        type: ObjectId,
        required: true,
        ref: "post"
    },
    reporter: {
        type: ObjectId,
        required: true,
        ref: "user"
    },
    reportBody: {
        type: String,
        required: true,
        default: null,
    },
    reportType: {
        type: String, 
        enum: Object.values(reportType), 
        default: reportType.something_else,
    },
}, { timestamps: true });

const model = mongoose.model("reported_post", schema);
module.exports = { ReportedPostModel: model };