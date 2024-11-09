const AWS = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
const { v4: uuidv4 } = require("uuid");

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY,
});

const fileStorageEngine = multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    key: function (req, file, cb) {
        cb(null, `profile-pic/${uuidv4()}--${file.originalname}`);
    },
    acl: "public-read",
    Tagging: "public=yes",
    contentType: function (req, file, cb) {
        cb(null, file.mimetype);
    },
});

const upload = multer({ storage: fileStorageEngine });

module.exports = upload;
