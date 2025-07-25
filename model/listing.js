require("dotenv").config({path: "../.env"});
const mongoose = require("mongoose");
const Review = require("./review.js");
const DB_URL = process.env.ATLAS_URL;
const { values } = require("../utils/categories.js");

main()
    .then(() => console.log("connected to db"));
async function main() {
    await mongoose.connect(DB_URL);
}


const listingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,
    dateBegin: {
        type: String,
        required: true
    },
    dateEnd: {
        type: String,
        required: true
    },
    images: [{
        url: String,
        filename: String,
    }],
    price: Number,
    location: String,
    country: String,
    category: {
        type: String,
        enum: values,
        required: true,
    },
    likes: {
        type: Number,
        default: 0,
    },
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review"
    }],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
})


listingSchema.post("findOneAndDelete", async(listing) => {
    if(listing.reviews.length) {
        await Review.deleteMany({_id: {$in: listing.reviews}});
    }
})


const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;