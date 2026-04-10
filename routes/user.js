const express = require("express");
const router = express.Router();
const User = require("../models/user");
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const { savedRedirectUrl } = require("../middleware");

const userController = require("../controllers/users");

// router.get("/signup", userController.renderSignupForm);
// router.post("/signup", wrapAsync(userController.signupUser));

router
  .route("/signup")
  .get(userController.renderSignupForm)
  .post(wrapAsync(userController.signupUser));



// router.get("/login", userController.renderLoginForm);
// router.post(
//   "/login",
//   savedRedirectUrl,
//   passport.authenticate("local", {
//     failureFlash: true,
//     failureRedirect: "/login",
//   }),
//   userController.userLogin
// );

router
  .route("/login")
  .get(userController.renderLoginForm)
  .post(
    savedRedirectUrl,
    passport.authenticate("local", {
      failureFlash: true,
      failureRedirect: "/login",
    }),
    userController.userLogin
  );

router.get("/logout", userController.logoutUser);
module.exports = router;
