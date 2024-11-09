const mongoose = require("mongoose");
const { Schema, ObjectId } = mongoose;

const jobType = Object.freeze({
  remote: "remote",
  onsite: "onsite",
  hybrid: "hybrid"
});

const schema = new Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: false
  },
  user: {
    type: ObjectId,
    required: true,
    ref: "user"
  },
  organization: {
    type: ObjectId,
    required: true,
    ref: "organization"
  },
  employmentType: [{
    type: String,
    enum: ["full-time", "part-time", "contractual"],
    required: true,
    lowercase: true
  }],
  experience: {
    type: String,
    enum: ["fresher", "0-1 year", "1-3 year", "3+ year"],
    required: true,
    lowercase: true
  },
  role: {
    type: String,
    required: true
  },
  skills: [{
    type: String,
    required: false,
    default: null
  }],
  location: {
    type: String,
    required: false
  },
  jobType: {
    type: String,
    enum: Object.values(jobType),
    required: true,
    lowercase: true
  },
  maxSalary: {
    type: Number,
    required: false,
    default: null
  },
  minSalary: {
    type: Number,
    required: false,
    default: null
  },
  salaryNegotiable: {
    type: Boolean,
    required: false,
    default: false
  },
  benefits: [{
    type: String,
    required: false,
    default: null
  }],
  publish: {
    type: Boolean,
    required: false,
    default: false
  },
  deadline: {
    type: Date,
    required: false,
    default: null
  },
  questions: [{
    type: String,
    required: false,
    default: null
  }]
}, { timestamps: true });

const model = mongoose.model("jobPost", schema);
module.exports = { JobPostModel: model, JobPostType: jobType };