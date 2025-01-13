require("dotenv").config();
const mongoose = require("mongoose");
let initData = require("./data");
const Listing = require("../model/listing");
// const DB_URL = process.env.ATLAS_URL;

main()
    .then(() => console.log("connected to db"));
async function main() {
    await mongoose.connect("mongodb://127.0.0.1:27017/traveldiaries");
}

let initDB = async () => {
    await Listing.deleteMany({});
    initData.data = initData.data.map((listing) => ({...listing, owner: "677fc1d8652d4c01df09677a"}));
    await Listing.insertMany(initData.data);
    console.log("database working");
}

initDB();