const mongoose = require("mongoose");
const { Schema, ObjectId } = mongoose;

const schema = new Schema({
    name: {
        type: String,
        required: true
    },
    logo: {
        type: String,
        required: false,
        default: null
    },
    user: {
        type: ObjectId,
        required: true,
        ref: "user"
    },
    description: {
        type: String,
        required: false,
        default: null,
    },
}, { timestamps: true });

const OrganizationModel = mongoose.model("organization", schema);
module.exports = OrganizationModel;