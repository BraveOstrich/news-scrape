var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");

//==== Initialize Express ====//
var db = require("./models");

var PORT = 3000;

var app = express();

app.use(logger("dev"));
app.use(express.urlencoded({ extended: true}));
app.use(express.json());
app.use(express.static("public"));

mongoose.connect("mongodb://localhost/", { useNewUrlParser: true });


app.get("/scrape", function(req, res) {

    axios.get("http://www.nytimes.com/").then(function(response) {

        var $ = cheerio.load(response.data);

        $("balancedHeadline").each(function(i, element) {

            var result = {};

            result.title = $(this).children("a").text();
            result.link = $(this).children("a").attr("href");

            db.Article.create(result)
                .then(function(dbArticle) {
                // View the added result in the console
                console.log(dbArticle);
                })
                .catch(function(err) {
                // If an error occurred, log it
                console.log(err);
                });
        });

        res.send("Scrape Complete");
    });
});

app.get("/articles", function(req, res) {
    db.Article.find({})
      .then(function(dbArticle) {
        res.json(dbArticle);
      })
      .catch(function(err) {
        res.json(err);
      });
  });

app.get("/articles/:id", function(req, res) {
db.Article.findOne({ _id: req.params.id })
    .populate("note")
    .then(function(dbArticle) {
    res.json(dbArticle);
    })
    .catch(function(err) {
    res.json(err);
    });
});

app.post("/articles/:id", function(req, res) {
    // Create a new note and pass the req.body to the entry
    db.Comment.create(req.body)
      .then(function(dbComment) {
        // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
        // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
        // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
        return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
      })
      .then(function(dbArticle) {
        // If we were able to successfully update an Article, send it back to the client
        res.json(dbArticle);
      })
      .catch(function(err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
});

app.listen(PORT, function() {
    console.log("App is running on port " + PORT + "!");
  });