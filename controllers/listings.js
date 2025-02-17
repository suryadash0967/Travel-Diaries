const Listing = require("../model/listing.js");
const User = require("../model/user.js");
const cloudinary = require('cloudinary').v2;
const date = require("date-and-time");

const hasUserLiked = (user, listingId) => {
    if(!user) return false;
    return user.likedPosts.some(post => post.toString() === listingId.toString());
};

module.exports.index = async (req, res) => {
    let allListings = await Listing.find().populate("owner");
    let user = req.user ? await User.findById(req.user._id.toString()) : undefined;

    allListings.sort((a, b) => b.likes - a.likes);

    res.render("listings/listings.ejs", { allListings, user, hasUserLiked });
};


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
    let user = req.user ? await User.findById(req.user._id.toString()) : undefined;

    if(!listing) {
        req.flash("error", "Listing you requested does not exist!");
        res.redirect("/listings");
    }
    res.render("listings/show.ejs", {listing, user, hasUserLiked});
}

module.exports.createNewListing = async (req, res, next) => {
    try {
        let dateBegin = req.body.listing.dateBegin;
        let dateEnd = req.body.listing.dateEnd;

        const inputPattern = 'YYYY-MM-DD';
        const outputPattern = 'MMM DD YYYY';

        dateBegin = date.parse(dateBegin, inputPattern);
        dateEnd = date.parse(dateEnd, inputPattern);

        const formattedDateBegin = date.format(dateBegin, outputPattern);
        const formattedDateEnd = date.format(dateEnd, outputPattern);


        let images = req.files.map(file => ({
            url: file.path,
            filename: file.filename,
        }));

        if (images.length > 15) {
            images = images.slice(0, 15); // Keep only the first 15 images
            req.flash("error", "You uploaded too many images! Only the first 15 were saved.");
        } else {
            req.flash("success", `New Post Created!`);
        }

        const listing = new Listing({
            ...req.body.listing,
            dateBegin: formattedDateBegin,
            dateEnd: formattedDateEnd,
            images,
            owner: req.user._id,
        });

        await listing.save();
        res.redirect(`/listings/${listing._id}`);
    } catch (error) {
        next(error);
    }
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
    const incomingListing =  req.body.listing;

    let dateBegin = req.body.listing.dateBegin;
    let dateEnd = req.body.listing.dateEnd;

    const inputPattern = 'YYYY-MM-DD';
    const outputPattern = 'MMM DD YYYY';

    dateBegin = date.parse(dateBegin, inputPattern);
    dateEnd = date.parse(dateEnd, inputPattern);

    const formattedDateBegin = date.format(dateBegin, outputPattern);
    const formattedDateEnd = date.format(dateEnd, outputPattern);

    incomingListing.dateBegin = formattedDateBegin;
    incomingListing.dateEnd = formattedDateEnd;

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
            cloudinary.api.delete_resources(
                [image.filename],
                { type: 'upload', resource_type: 'image' }
            ).then(console.log);
        }
    }

    listing.images = imagesToKeep;

    Object.assign(listing, incomingListing);
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
                for(let image of listing.images) {
                    cloudinary.api.delete_resources(
                        [image.filename],
                        { type: 'upload', resource_type: 'image' }
                    ).then(console.log);
                }
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


module.exports.renderSortedPage = async (req, res) => {
    let {order} = req.query;
    let user = req.user ? await User.findById(req.user._id.toString()) : undefined;
    let allListings = await Listing.find().populate("owner");
    if(order === "Most Liked") {
        allListings.sort((a, b) => b.likes - a.likes);
    } else if(order === "Most Commented") {
        allListings.sort((a, b) => b.reviews.length - a.reviews.length);
    }
    res.render("listings/listings.ejs", {allListings, user, hasUserLiked});
}


module.exports.handleImageDelete = async (req, res) => {
    let {id, index} = req.params;
    index = parseInt(index, 10);
    let listing = await Listing.findById(id);
    console.log(listing.images)

    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    if(listing.images.length === 1) {
        req.flash("error", "Edit and add another image before deleting this last image.");
        return res.redirect(`/listings/${id}`);
    }
    

    if (listing.images.length > index) {
        let image = listing.images[index];

        try {
            cloudinary.api.delete_resources(
                [image.filename],
                { type: 'upload', resource_type: 'image' }
            ).then(console.log);
        } catch (err) {
            console.error(`Failed to delete image: ${image.filename}`, err);
        }
    }
    let images = listing.images.filter((image, idx) => idx != index);
    listing.images = images;

    await listing.save();
    req.flash("success", "Image deleted successfully !")
    res.redirect(`/listings/${id}`);
}



module.exports.likeListing = async (req, res) => {
    let {id} = req.params;
    let listing = await Listing.findById(id);
    let user = req.user ? await User.findById(req.user._id.toString()) : undefined;
    if(!hasUserLiked(user, id)) {
        listing.likes++;
        user.likedPosts.push(listing);
    } else {
        listing.likes--;
        user.likedPosts = user.likedPosts.filter(post => post._id.toString() !== id);
        listing.hasLiked = false;
    }
    await listing.save();
    await user.save();
    res.redirect(`/listings/${id}`);
}
