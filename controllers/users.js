const User = require("../models/user");


module.exports.renderSignupForm =  (req, res) => {
  res.render("users/signup.ejs");
}



module.exports.renderLoginForm = (req, res) => {
  res.render("users/login.ejs");
}

module.exports.signupUser = async (req, res) => {
    try {
      const { username, email, password } = req.body;
      const user = new User({ username, email });
      const registeredUser = await User.register(user, password);
      req.login(registeredUser, (err) => {
        if (err) return next(err);
      req.flash("success", "Welcome to StaySphere!");
      res.redirect("/listings");
      });
    } catch (e) {
      req.flash("error", e.message);
      res.redirect("signup");
    }
  }


module.exports.userLogin = async (req, res) => {
    req.flash("success", "Welcome back!");
    // res.redirect("/listings");
    
    let redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
  }



module.exports.logoutUser = (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "You logged out successfully!");
    res.redirect("/listings");
  });
}