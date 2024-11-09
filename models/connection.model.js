const mongoose = require("mongoose");
const { Schema, ObjectId } = mongoose;

const status = Object.freeze({
    requested: 'requested',
    accepted: 'accepted',
    declined: 'declined',
    blocked: 'blocked',
});

const schema = new Schema({
    follower: {
        type: ObjectId,
        required: true,
        ref: "user"
    },
    followee: {
        type: ObjectId,
        required: true,
        ref: "user"
    },
    status: { 
        type: String, 
        enum: Object.values(status), 
        default: status.requested,
    },
}, { timestamps: true });

const model = mongoose.model("connection", schema);
module.exports = { ConnectionModel: model, ConnectionStatus: status };