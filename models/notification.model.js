const mongoose = require("mongoose");
const { Schema, ObjectId } = mongoose;

const status = Object.freeze({
    sent: 'sent',
    seen: 'seen'
});

const readingStatus = Object.freeze({
    read: 'read',
    unread: 'unread',
});

const notificationType = Object.freeze({
    like: 'like',
    dislike: 'dislike',
    comment: 'comment',
    reply: 'reply',
    mention: 'mention',
    share: 'share',
    request: 'request',
    accept: 'accept'
});

const schema = new Schema({
    user: {
        type: ObjectId,
        required: true,
        ref: "user"
    },
    post: {
        type: ObjectId,
        required: false,
        ref: "user"
    },
    comment: {
        type: ObjectId,
        required: false,
        ref: "user"
    },
    reply: {
        type: ObjectId,
        required: false,
        ref: "user"
    },
    recipient: {
        type: ObjectId,
        required: true,
        ref: "user"
    },
    type: {
        type: String,
        enum: Object.values(notificationType),
        required: true
    },
    message: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(status),
        required: true,
        default: status.sent,
    },
    readingStatus: {
        type: String,
        enum: Object.values(readingStatus),
        required: true,
        default: readingStatus.unread,
    },
}, { timestamps: true });

const model = mongoose.model("notification", schema);
module.exports = { NotificationModel: model, NotificationStatus: status, NotificationType: notificationType, NotificationReadingStatus: readingStatus };