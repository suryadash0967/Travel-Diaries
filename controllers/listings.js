const Listing = require("../model/listing.js");
const cloudinary = require('cloudinary').v2;

module.exports.index = async (req, res) => {
    let allListings = await Listing.find().populate("owner");
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
    console.log(req.body.listing);
    let images = req.files.map(file => ({
        url: file.path,
        filename: file.filename,
    }));

    if (images.length > 15) {
        images = images.slice(0, 15); // Keep only the first 15 images
        req.flash("error", "You uploaded too many images! Only the first 15 were saved.");
    } else {
        req.flash("success", "New Post Created!");
    }

    const listing = new Listing({
        ...req.body.listing,
        images,
        owner: req.user._id,
    });

    await listing.save();
    res.redirect("/listings");
};



module.exports.renderEditForm = async (req, res) => {
    let {id} = req.params;
    let listing = await Listing.findById(id);

    if(!listing) {
        req.flash("error", "Listing you requested does not exist!");
    }
    res.render("listings/edit.ejs", {listing});
}

module.exports.updateListing = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Post not found!");
        return res.redirect("/listings");
    }

    const newImages = req.files.map(file => ({
        url: file.path,
        filename: file.filename,
    }));

    const totalImages = [...listing.images, ...newImages];
    const imagesToKeep = totalImages.slice(0, 15);

    if (totalImages.length > 15) {
        const imagesToRemove = totalImages.slice(15);
        for (const image of imagesToRemove) {
            await cloudinary.uploader.destroy(image.filename.split('.')[0]);
        }
    }

    listing.images = imagesToKeep;

    Object.assign(listing, req.body.listing);
    await listing.save();

    req.flash("success", "Post Updated!");
    res.redirect(`/listings/${id}`);
};


module.exports.deleteListing = async (req, res) => {
    let {id} = req.params;
    let listing = await Listing.findByIdAndDelete(id);

    if (listing.images.length > 0) {
        for (const image of listing.images) {
            try {
                await cloudinary.uploader.destroy(image.filename.split('.')[0]);
            } catch (err) {
                console.error(`Failed to delete image: ${image.public_id}`, err);
            }
        }
    }
    
    req.flash("success", "Post Deleted!");
    res.redirect("/listings");
}

module.exports.renderShortlistedPage = async (req, res) => {
    let { q, category } = req.query;

    if ((!q || q.trim() === "") && (!category || category.trim() === "")) {
        req.flash("error", "No such post or region found!");
        return res.redirect("/listings");
    }

    try {
        const listings = await Listing.find();
        let filteredListings;
        if(q && category) {
            filteredListings = listings.filter((listing) =>
                (listing.title.toLowerCase().includes(q.toLowerCase()) || 
                listing.country.toLowerCase().includes(q.toLowerCase()) || 
                listing.location.toLowerCase().includes(q.toLowerCase()))
                &&
                (listing.category.toLowerCase().includes(category.toLowerCase()))
            );
        } else if(q) {
            filteredListings = listings.filter((listing) =>
                listing.title.toLowerCase().includes(q.toLowerCase()) || 
                listing.country.toLowerCase().includes(q.toLowerCase()) || 
                listing.location.toLowerCase().includes(q.toLowerCase())
            );
        } else {
            filteredListings = listings.filter((listing) =>
                listing.category.toLowerCase().includes(category.toLowerCase())
            );
        }
        

        return res.render("searchResults.ejs", { filteredListings, q, category});
    } catch (err) {
        console.error(err);
        req.flash("error", "Something went wrong. Please try again.");
        res.redirect("/listings");
    }
}




