const express = require("express");
const router = express.Router({mergeParams: true});
const WrapAsync = require("../utils/WrapAsync");
const passport = require("passport");
const { isLoggedIn, saveRedirectUrl } = require("../middlewares.js");
const usersControllers = require("../controllers/users.js");


router.get("/signup", usersControllers.renderSignUpPage)
router.post("/signup", WrapAsync(usersControllers.handleNewSignUp))
router.get("/login", usersControllers.renderLogInPage);

router.post("/login",
    saveRedirectUrl,
    passport.authenticate("local", {
        failureRedirect: "/login",
        failureFlash: true
    }), // PASSPORT MIDDLEWARE

    WrapAsync(usersControllers.handleLogIn)
);

router.get("/logout", usersControllers.handleLogOut);

router.get("/about", (req, res) => {
    res.render("about/about.ejs");
})

router.get("/profile/:id", isLoggedIn, usersControllers.renderProfilePage)

module.exports = router;