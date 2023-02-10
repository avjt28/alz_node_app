const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://swati:SWati%4012@clusterfaces.f1wayip.mongodb.net/?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true}, function(err) {
    if (err) {
        console.log(err);
    } else {
        console.log("Mongo Connected");
    }
});

const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({limit:'50mb'}));
app.use(express.static("public"));


const userSchema = new mongoose.Schema ({
    username: String,
    friend : {
        image : Array, //append base 64 img here if name is already in DB
        name : String
        }
});

const User = new mongoose.model("User", userSchema);

app.get("/", function(req, res) {
    User.find({username: "Swati"}, function(err, foundUser) {
        if(err) {
            console.log(err);
        } else {
            let friend_info = [];
            for(let i=0; i<foundUser.length; i++) {
                let description = [];
                let d = [];
                description.push(foundUser[i].friend.name);
                for(let j=0; j<foundUser[i].friend.image.length; j++) {
                    d.push(foundUser[i].friend.image[j]);
                }
                description.push(d);
                friend_info.push(description);
            }
            res.render("index", {friend_info: friend_info});
        }
    });
})

app.post("/upload", function(req, res) {
    const userData = new User({
        username: "Swati",
        friend: {
            image: req.body.canvasimg,
            name: req.body.name
        } 
    });
    User.findOneAndUpdate({"friend.name": req.body.name}, { $push: { "friend.image": req.body.canvasimg }}, function(err, foundUser) {
        if(err) {
            console.log(err);    
        } else {
            if(foundUser == null){
                userData.save(function(err) {
                    if(err) {
                        console.log(err);
                    } else {
                        console.log("Data Saved");
                        res.redirect("/");
                    }
                });
            }
        }
    }); 
});

app.get("*", function(req, res){
    res.send("404 Error!")
})

app.listen(3000, function() {
    console.log("Server started on port 3000");
});