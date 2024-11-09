const mongoose = require("mongoose");
const { Schema, ObjectId } = mongoose;

const schema = new Schema({
    user: {
        type: ObjectId,
        required: true,
        ref: "user"
    },
    context: {
        type: String,
        required: true,
        default: null,
    },
    points: {
        type: Number,
        required: true,
        default: null,
    },
    cumulativePoints: {
        type: Number,
        required: true,
        default: null,
    },
    interactorId: {
        type: ObjectId,
        required: true,
        ref: "user",
        default: null,
    },
    postId: {
        type: ObjectId,
        required: false,
        ref: "post",
        default: null,
    },
    commentId: {
        type: ObjectId,
        required: false,
        default: null,
    },
}, { timestamps: true });

const model = mongoose.model("point", schema);
module.exports = { PointModel: model };