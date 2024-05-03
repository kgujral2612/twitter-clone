const mongoose = require("mongoose");

class Database{

    constructor(){
        this.connect();
    }

    connect(){
        mongoose.connect("mongodb+srv://admin:Coretex1$@twitterclonecluster.uvra23i.mongodb.net/twitter-clone?retryWrites=true&w=majority&appName=TwitterCloneCluster")
        .then(()=> {
            console.log("DB connection successful")
        })
        .catch((err)=>{
            console.log("DB connection successful" + err)
        })
    }
}

module.exports = new Database();