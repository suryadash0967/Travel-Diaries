if(process.env.NODE_ENV != "production") {
    require('dotenv').config(); 
}
const express = require("express");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const app = express();
const port = 5050;
const path = require("path");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./model/user.js");
const DB_URL = process.env.ATLAS_URL;


app.set("view engine", "ejs");
app.engine('ejs', ejsMate);
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));

const store = MongoStore.create({
    mongoUrl: DB_URL,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 60 * 60, // time in secs after which the session will end
})

store.on("error", (err) => {
    console.log("Error in mongo session store: ", err);
})

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 1 week in milliseconds
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    }
}


app.listen(port, () => console.log(`listening on port ${port}`));

app.get("/", (req, res) => {
    res.redirect("/listings");
})



app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
})



const listingsRouter = require("./routes/listing.js");
const reviewsRouter = require("./routes/reviews.js");
const signupRouter = require("./routes/user.js");

app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewsRouter);
app.use("/", signupRouter);

app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page not found!"));
})

// ERROR HANDLING MIDDLEWARE
app.use((err, req, res, next) => {
    console.error("Error detected:", err);
    let { status = 500, message} = err; 
    res.status(status).render("error.ejs", {err});
})

