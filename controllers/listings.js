const Listing = require("../models/listing");
const { validateListing, isLoggedIn, isOwner } = require("../middleware");
const ExpressError = require("../utils/ExpressError");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

// escape user input for regex search
function escapeRegex(text = "") {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

module.exports.index = async (req, res) => {
  try {
    const qRaw = req.query.q || "";
    const categoryRaw = req.query.category || "";
    const q = qRaw.trim();
    const category = categoryRaw.trim().toLowerCase();

    // Build combined AND query so q and category can both be applied
    const andClauses = [];

    if (q) {
      const safe = escapeRegex(q);
      const regex = new RegExp(safe, "i");
      andClauses.push({
        $or: [
          { title: regex },
          { location: regex },
          { country: regex },
          { description: regex }
        ]
      });
    }

    if (category) {
      // treat category both as explicit category field OR as keyword in text fields
      const catSafe = escapeRegex(category.replace(/-/g, ' '));
      const catRegex = new RegExp(catSafe, "i");
      andClauses.push({
        $or: [
          { category: category },
          { title: catRegex },
          { location: catRegex },
          { country: catRegex },
          { description: catRegex }
        ]
      });
    }

    const mongoQuery = andClauses.length ? { $and: andClauses } : {};

    const allListings = await Listing.find(mongoQuery).exec();
    res.render("listings/index.ejs", { allListings, q, category });
  } catch (err) {
    console.error("Listings index error:", err);
    req.flash("error", "Unable to fetch listings");
    res.redirect("/listings");
  }
};

module.exports.renderNewForm = (req, res, next) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Cannot find that listing!");
    return res.redirect("/listings");
  }
  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
  let response = await geocodingClient
    .forwardGeocode({
      query: req.body.listing.location,
      limit: 1,
    })
    .send();

  
    

  let url = req.file.path;
  let filename = req.file.filename;

  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = { url, filename };
  newListing.geometry = response.body.features[0].geometry;
  await newListing.save();
  req.flash("success", "Successfully made a new listing!");
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Cannot find that listing!");
    return res.redirect("/listings");
  }

  let originalImage = listing.image.url;
  originalImage = originalImage.replace("/upload/", "/upload/h_250,w_300/");
  res.render("listings/edit.ejs", { listing, originalImage });
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;

  let listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Cannot find that listing!");
    return res.redirect("/listings");
  }

  const locationChanged =
    req.body.listing.location &&
    req.body.listing.location !== listing.location;

  if (locationChanged) {
    let response = await geocodingClient
      .forwardGeocode({
        query: req.body.listing.location,
        limit: 1,
      })
      .send();
    if (response.body.features.length > 0) {
      listing.geometry = response.body.features[0].geometry;
    }
  }

  Object.assign(listing, req.body.listing);

  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
  }

  await listing.save();
  req.flash("success", "Successfully updated the listing!");
  res.redirect(`/listings/${id}`);
};

module.exports.deleteListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  // console.log(deletedListing);
  req.flash("success", "Successfully deleted the listing!");
  res.redirect("/listings");
};
