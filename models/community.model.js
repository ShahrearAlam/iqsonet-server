const mongoose = require("mongoose");
const { Schema, ObjectId } = mongoose;

const schema = new Schema({
  name: {
    type: String,
    required: true,
  },
  tagline: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  profilePhoto: {
    type: String,
    required: true,
    default: null,
  },
  coverPhoto: {
    type: String,
    required: true,
    default: null,
  },
  topics: [{
    type: String,
    required: true,
    default: null,
  }],
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: false,
  }],
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: false,
  }],
  requests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: false,
  }],
}, { timestamps: true });

const model = mongoose.model("community", schema);
module.exports = { CommunityModel: model };
