const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const Listing = require("./listing.js")

const userSchema = new mongoose.Schema ({
    email: {
        type: String,
        required: true,
    },
    likedPosts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listing"
    }]
    // username and password are defined by default by passportLocalMongoose
})

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);
module.exports = User;
