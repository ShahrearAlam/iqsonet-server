const mongoose = require("mongoose");
const { Schema, ObjectId } = mongoose;

const schema = new Schema({
    user: {
        type: ObjectId,
        required: true,
        ref: "user"
    },
    post: {
        type: ObjectId,
        required: true,
        ref: "post"
    },
}, { timestamps: true });

const model = mongoose.model("saved_post", schema);
module.exports = { SavedPostModel: model };