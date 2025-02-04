const User = require("../model/user.js");

module.exports.renderSignUpPage = (req, res) => {
    res.render("auth/signup.ejs");
}

module.exports.handleNewSignUp = async (req, res) => {
    try {
        let {username, email, password} = req.body;
        const newUser = new User({email, username});
        let registeredUser = await User.register(newUser, password);
        req.login(registeredUser, (err) => {
            if(err) {
                return next(err);
            }
            req.flash("success", "Welcome to Travel Diaries!");
            res.redirect("/listings");
        });
    }
    catch(err) {
        req.flash("error", err.message);
        res.redirect("/signup");
    }
}

module.exports.renderLogInPage = (req, res) => {
    res.render("auth/login.ejs");
}

module.exports.handleLogIn = async (req, res) => {
    req.flash("success", "Welcome back to Travel Diaries!");
    let redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
}

module.exports.handleLogOut = (req, res) => {
    req.logout((err) => {
        if(err) {
            return next(err);
        }
        req.flash("success", "You are logged out!");
        res.redirect("/listings");
    })
}


module.exports.renderProfilePage = async (req, res) => {

}