if(process.env.NODE_ENV != "production"){
  require("dotenv").config();
}

// console.log(process.env.SECRET);



const express = require("express");
const app = express();
const mongoose = require("mongoose"); 
const path = require("path");
const methodOverride = require("method-override");
const wrapAsync = require("./utils/wrapAsync");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;


const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const Listing = require("./models/listing");

const ExpressError = require("./utils/ExpressError");  
const listingRoutes = require("./routes/listing");
const reviewRoutes = require("./routes/review");
const userRoutes = require("./routes/user");

let url = "mongodb://127.0.0.1:27017/airbnb";
// let mongoDBUrl = process.env.ATLASDB_URL;
// let mongoDBUrl = process.env.ATLASDB_URL;
mongoose
  .connect(url)
  .then(() => {
    console.log("DB connected");
  })
  .catch((err) => {
    console.log(err);
  });

const store = MongoStore.create({
  mongoUrl: url,
  crypto: {
    secret: process.env.SECRET,  
  },
  touchAfter: 24 * 60 * 60,
});

store.on("error", function (e) {
  console.log("SESSION STORE ERROR", e);
});

const sessionOptions = {
  store: store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie : {
    httpOnly : true,
    expires : Date.now() + 1000 * 60 * 60 * 24 *7,
    maxAge : 1000 * 60 * 60 * 24 *7
  }
};



// app.get("/", (req, res) => {
//   res.send("Hi, I am root");
// });

app.use(session(sessionOptions));
app.use(flash());


// Passport configuration
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
 
// Flash middleware
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentUser = req.user;
  // expose current search query and category to all views (defaults to empty strings)
  res.locals.q = req.query.q || "";
  res.locals.category = req.query.category || "";
  next();
});
 

// app.get("/fakeUser", async (req, res) => {
//   let user = new User({  email: "testuser@example.com", username: "testuser" });
//   let registeredUser = await User.register(user, "mypassword");
//   res.send(registeredUser);
// });




app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "public")));

app.get('/', wrapAsync(async (req, res) => {
  const featuredListings = await Listing.find({}).limit(6).exec();
  res.render('home', {
    title: 'Wanderlust | Find your next adventure',
    featuredListings,
  });
}));

app.use("/listings", listingRoutes);
app.use("/listings/:id/reviews", reviewRoutes);
app.use("/", userRoutes);


app.use((req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

app.use((err, req, res, next) => {
  let { statusCode = 500, message = "message went wrong" } = err;
  // res.send("something went wrong")
  // res.status(statusCode).send(message);
  res.status(statusCode).render("error", { message });
});




app.listen(8080, () => {
  console.log("server connected successfully");
});
