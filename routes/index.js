var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index");
});

router.get("/hello", function (req, res, next) {
  res.render("hello");
});

module.exports = router;
