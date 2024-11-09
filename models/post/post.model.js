const mongoose = require("mongoose");
const { Schema, ObjectId } = mongoose;

const status = Object.freeze({ 
    active: 'active',
    banned: 'banned',
    deleted: 'deleted',
});

const accessibilityType = Object.freeze({ 
    public: 'public',
    followersOnly: 'followersOnly',
});

const reactionType = Object.freeze({ 
    like: 'like',
    dislike: 'dislike',
});

const reactionSchema = new Schema({
    user: { type: ObjectId, required: false, ref: "user" },
    type: { type: String, enum: Object.values(reactionType) },
}, { _id: true, timestamps: true });

const replySchema = new Schema({
    user: { type: ObjectId, required: false, ref: "user" },
    body: { type: String, required: false, default: null },
    reactions: [{ type: reactionSchema, required: false, default: () => ({}) }],
}, { _id: true, timestamps: true });

const commentSchema = new Schema({
    user: { type: ObjectId, required: false, ref: "user" },
    body: { type: String, required: false, default: null },
    reactions: [{ type: reactionSchema, required: false, default: () => ({}) }],
    replies: [{ type: replySchema, required: false, default: () => ({}) }],
}, { _id: true, timestamps: true });

const editSchema = new Schema({
    body: { type: String, required: false, default: null },
    time: { type: Date, required: false, default: null },
}, { _id: true, timestamps: true });

const schema = new Schema({
    user: {
        type: ObjectId,
        required: true,
        ref: "user"
    },
    body: {
        type: String,
        required: true,
        default: null,
    },
    pictures: [{
        type: String,
        required: false,
        default: null,
    }],
    mentions: [{
        type: ObjectId,
        required: false,
        default: null,
        ref: "user"
    }],
    comments: [{
        type: commentSchema,
        required: false,
        default: () => ({}),
    }],
    reactions: [{
        type: reactionSchema,
        required: false,
        default: () => ({}),
    }],
    share: {
        type: ObjectId,
        required: false,
        ref: "post"
    },
    edits: [{
        type: editSchema,
        required: false,
        default: () => ({}),
    }],
    accessibility: { 
        type: String, 
        enum: Object.values(accessibilityType), 
        default: accessibilityType.public, 
    },
    reactionsCount: {
        type: Number,
        required: false,
    },
    shareCount: {
        type: Number,
        required: false,
    },
    status: { 
        type: String, 
        enum: Object.values(status), 
        default: status.active, 
    },
}, { timestamps: true });

const model = mongoose.model("post", schema);
module.exports = { PostModel: model, PostStatus: status, ReactionType: reactionType, AccessibilityType: accessibilityType };