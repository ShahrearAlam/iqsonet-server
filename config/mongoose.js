const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_URL).catch(err => {
    console.log("Mongoose connection error: " + err);
});

mongoose.connection.once("open", () => {
    console.log("Mongoose connected.");

    mongoose.connection.on("connected", () => {
        console.log("Mongoose event connected");
    });

    mongoose.connection.on("disconnected", () => {
        console.log("Mongoose event disconnected");
    });

    mongoose.connection.on("reconnected", () => {
        console.log("Mongoose event reconnected");
    });

    mongoose.connection.on("error", error => {
        console.log("Mongoose event error");
        console.log(error);
    });
});

module.exports = mongoose;