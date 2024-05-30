var express = require("express");
var router = express.Router();
const userModel = require("./users");
const postModel = require("./post");
const passport = require("passport");
const upload = require("./multer");

const localStrategy = require("passport-local");
passport.use(new localStrategy(userModel.authenticate()));



router.get("/", function (req, res, next) {
  res.render("index", { nav: false });
});



router.get("/register", function (req, res, next) {
  res.render("register", { nav: false });
});



router.get("/profile", isLoggedIn, async function (req, res, next) {
  const user = await userModel
    .findOne({ username: req.session.passport.user })
    .populate("posts");
  res.render("profile", { user, nav: true });
});



router.get("/show/posts", isLoggedIn, async function (req, res, next) {
  const user = await userModel
    .findOne({ username: req.session.passport.user })
    .populate("posts");
  res.render("show", { user, nav: true });
});



router.get("/feed", isLoggedIn, async(req, res, next)=>{
  const user = await userModel.findOne({username: req.session.passport.user})
  const posts = await postModel.find()
  .populate("user")
  res.render("feed", {user, posts, nav:true});
});



router.get("/add", isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user });

  res.render("add", { user, nav: true });
});



router.post(
  "/createpost",
  isLoggedIn,
  upload.single("postimage"),
  async function (req, res, next) {
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });
    console.log("data is", req.file);
    const post = await postModel.create({
      user: user._id,
      title: req.body.title,
      description: req.body.description,
      Image: req.file.filename,
    });

    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile");
  }
);



router.post("/register", function (req, res, next) {
  const data = new userModel({
    username: req.body.username,
    email: req.body.email,
    contact: req.body.contact,
  });
  userModel.register(data, req.body.password).then(() => {
    passport.authenticate("local")(req, res, function () {
      res.redirect("/profile");
    });
  });
});

router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/",
    successRedirect: "/profile",
  }),
  (req, res, next) => {}
);

router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}

router.post(
  "/fileupload",
  isLoggedIn,
  upload.single("image"),
  async (req, res, next) => {
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });
    user.profileImage = req.file.filename;
    await user.save();
    res.redirect("/profile");
  }
);

module.exports = router;
