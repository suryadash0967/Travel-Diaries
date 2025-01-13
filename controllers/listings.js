const Listing = require("../model/listing.js");

module.exports.index = async (req, res) => {
    let allListings = await Listing.find();
    res.render("listings/listings.ejs", {allListings});
}

module.exports.renderNewForm = async (req, res) => {
    res.render("listings/create.ejs");
}

module.exports.showListing = async (req, res) => {
    let {id} = req.params;
    let listing = await Listing.findById(id).populate("owner").populate({
        path: "reviews",
        populate: {
            path: "author",
        },
    });

    if(!listing) {
        req.flash("error", "Listing you requested does not exist!");
        res.redirect("/listings");
    }
    res.render("listings/show.ejs", {listing});
}

module.exports.createNewListing = async (req, res, next) => {
    let url = req.file.path;
    let filename = req.file.filename;
    let listing = req.body.listing;
    let newListing = new Listing(listing);
    newListing.owner = req.user._id;
    newListing.image = {url, filename};
    await newListing.save();

    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
}

module.exports.renderEditForm = async (req, res) => {
    let {id} = req.params;
    let listing = await Listing.findById(id);
    req.session.listingImage = listing.image;
    if(!listing) {
        req.flash("error", "Listing you requested does not exist!");
    }
    res.render("listings/edit.ejs", {listing});
}

module.exports.updateListing = async (req, res) => {
    let {id} = req.params;
    let listing = req.body.listing;
    let updatedListing = await Listing.findByIdAndUpdate(id, listing);

    if(req.file) {
        let url = req.file.path;
        let filename = req.file.filename;
        updatedListing.image = {url, filename};
        await updatedListing.save();
    }

    req.flash("success", "New Listing Updated!");
    res.redirect(`/listings/${id}`);
}

module.exports.deleteListing = async (req, res) => {
    let {id} = req.params;
    await Listing.findByIdAndDelete(id);
    
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
}

module.exports.renderShortlistedPage = async (req, res) => {
    let { q } = req.query;

    if (!q || q.trim() === "") {
        req.flash("error", "Invalid listing or region!");
        return res.redirect("/listings");
    }

    try {
        const listings = await Listing.find();
        const filteredListings = listings.filter((listing) =>
            listing.title.toLowerCase().includes(q.toLowerCase()) || 
            listing.country.toLowerCase().includes(q.toLowerCase()) || 
            listing.location.toLowerCase().includes(q.toLowerCase())
        );

        return res.render("searchResults.ejs", { filteredListings, q});
    } catch (err) {
        console.error(err);
        req.flash("error", "Something went wrong. Please try again.");
        res.redirect("/listings");
    }
}




