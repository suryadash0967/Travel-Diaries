const Listing = require("./model/listing");
const Review = require("./model/review.js");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("./schema.js");

module.exports.validateUUID = (req, res, next) => {
    const { id } = req.params;
    const uuidRegex = /^[0-9a-fA-F]{24}$/; // Adjust regex for MongoDB ObjectId if necessary
    if (!uuidRegex.test(id)) {
        return next(new ExpressError(404, "Page not found!"));
    }
    next();
};

module.exports.validateListing = (req, res, next) => {
    let {error} = listingSchema.validate(req.body);
    if(error) {
        let errMsg = error.details.map(el => el.message).join(","); // joins all error messages
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
}

module.exports.validateReview = (req, res, next) => {
    let {error} = reviewSchema.validate(req.body);
    if(error) {
        let errMsg = error.details.map(el => el.message).join(","); // joins all error messages
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
}

module.exports.isLoggedIn = (req, res, next) => {
    if(!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl;
        // But req.session.redirectUrl will be reset by passport.
        // So we'll save the value in res's locals using a middleware below.
        // called in post request for "/login"
        req.flash("error", "You must be logged in first");
        return res.redirect("/login");
    }
    next();
}

module.exports.saveRedirectUrl = (req, res, next) => {
    if(req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
}
module.exports.saveListingImage = (req, res, next) => {
    if(req.session.listingImage) {
        res.locals.listingImage = req.session.listingImage;
    }
    next();
}

module.exports.isOwner = async (req, res, next) => {
    let {id} = req.params;
    let listing = await Listing.findById(id);
    if(!res.locals.currUser._id.equals(listing.owner)) {
        req.flash("error", "You don't have the permission!");
        return res.redirect(`/listings/${id}`);
    }
    next();
}

module.exports.isReviewAuthor = async (req, res, next) => {
    let {id, reviewId} = req.params;
    let review = await Review.findById(reviewId);
    console.log(res.locals.currUser);
    if(res.locals.currUser && !res.locals.currUser._id.equals(review.author)) {
        req.flash("error", "You don't have the permission!");
        return res.redirect(`/listings/${id}`);
    }
    next();
}