// const { listingSchema } = require('./schema');
// const ExpressError = require('./utils/ExpressError');



// const validateListing = (req, res, next) => {
//     let { error } = listingSchema.validate(req.body);
//     if (error) {
//         let errMsg = error.details.map((el) => el.message).join(",");
//         throw new ExpressError(400, errMsg);
//     } else {
//         next();
//     }
// }

// module.exports = { validateListing };





const { listingSchema , reviewSchema} = require("./schema");
const ExpressError = require("./utils/ExpressError");
const Listing = require("./models/listing");
const Review = require("./models/review");
const validateListing = (req, res, next) => {
  const { error } = listingSchema.validate(req.body);
  if (error) {
    const errMsg = error.details.map((el) => el.message).join(", ");
    return next(new ExpressError(400, errMsg));
  }
  next();
};

const validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    const errMsg = error.details.map((el) => el.message).join(", ");
    return next(new ExpressError(400, errMsg));
  }
  next();
};


const isLoggedIn = (req, res, next) => {
  
  if (!req.isAuthenticated()) {
    req.session.redirectUrl = req.originalUrl;
    req.flash("error", "You must be signed in first!");
    return res.redirect("/login");
  }
  next();
};

const savedRedirectUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  next();
}


const isOwner = async (req, res, next) => {
  // Logic to check if the user is the owner of the resource
      let { id } = req.params;
    let listing = await Listing.findById(id);
    if (!listing.owner._id.equals(res.locals.currentUser._id)) {
      req.flash("error", "You donot have permission to do that!");
      return res.redirect(`/listings/${id}`);
    }
    next();
};



// const isReviewAuthor = async (req, res, next) => {
//     let { reviewId } = req.params;
//     let review = await Review.findById(reviewId);
//     if (!review.auhtor.equals(res.locals.currentUser._id)) {
//       req.flash("error", "You donot have permission to delete it!");
//       return res.redirect(`/listings/${id}`);
//     }
//     next();
// };
const isReviewAuthor = async (req, res, next) => {
  const { id, reviewId } = req.params;

  const review = await Review.findById(reviewId);
  if (!review) {
    req.flash("error", "Review not found!");
    return res.redirect(`/listings/${id}`);
  }

  if (!review.author.equals(req.user._id)) {
    req.flash("error", "You do not have permission to delete it!");
    return res.redirect(`/listings/${id}`);
  }
  next();
};


module.exports = { validateListing, validateReview , isLoggedIn, savedRedirectUrl, isOwner, isReviewAuthor};
