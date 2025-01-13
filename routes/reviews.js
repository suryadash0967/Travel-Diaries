const express = require("express");
const router = express.Router({mergeParams: true});
const WrapAsync = require("../utils/WrapAsync.js");
const {validateReview, isLoggedIn, isReviewAuthor} = require("../middlewares.js");
const reviewControllers = require("../controllers/reviews.js");


router.post("/",
    isLoggedIn,
    validateReview,
    WrapAsync(reviewControllers.addNewReview)
);

router.delete("/:reviewId",
    isLoggedIn,
    isReviewAuthor,
    WrapAsync(reviewControllers.deleteReview)
);

module.exports = router;