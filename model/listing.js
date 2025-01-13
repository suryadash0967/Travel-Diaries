const mongoose = require("mongoose");
const Review = require("./review.js");
// const DB_URL = process.env.ATLAS_URL;

main()
    .then(() => console.log("connected to db"));
async function main() {
    await mongoose.connect("mongodb://127.0.0.1:27017/traveldiaries");
}

const listingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,
    image: {
        url: String,
        file: String,
    },
    price: Number,
    location: String,
    country: String,
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