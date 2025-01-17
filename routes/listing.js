const express = require("express");
const router = express.Router({mergeParams: true});
const WrapAsync = require("../utils/WrapAsync.js");
const {isLoggedIn, isOwner, validateListing, validateUUID} = require("../middlewares.js");
const listingControllers = require("../controllers/listings.js");
const multer  = require('multer');
const {storage} = require("../cloudConfig.js");
const upload = multer({ storage });


router.route("/")
.get(WrapAsync(listingControllers.index))
.post(
    isLoggedIn,
    upload.array('listing[images]'),
    validateListing,
    WrapAsync(listingControllers.createNewListing)
);


router.get("/new",
    isLoggedIn,
    WrapAsync(listingControllers.renderNewForm)
);

router.get("/search",
    WrapAsync(listingControllers.renderShortlistedPage)
);

router.delete("/:id/:index",
    isLoggedIn,
    isOwner,
    WrapAsync(listingControllers.handleImageDelete)
);


router.route("/:id")
.get(
    validateUUID,
    WrapAsync(listingControllers.showListing)
)
.put(
    isLoggedIn,
    isOwner,
    upload.array('listing[images]'),
    validateListing, 
    WrapAsync(listingControllers.updateListing)
)
.delete(
    isLoggedIn,
    isOwner,
    validateUUID,
    WrapAsync(listingControllers.deleteListing)
);

router.get("/:id/edit",
    isLoggedIn,
    isOwner,
    WrapAsync(listingControllers.renderEditForm)
);




module.exports = router;