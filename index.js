const express = require("express");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// userName database  :
// password database: 
const app = express();

// middleware
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.RESUME_BUILDER}:${process.env.RESUME_BUILDER_PASS}@cluster0.ozvnhci.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



// backend all code
async function run() {
  try {
   await client.connect()
   console.log("db-connect");

    // collection
   const resumeBuilderUsersCollection = client.db("Resume_Builder").collection("users");
   const resumeBuilderResumeCollection = client.db("Resume_Builder").collection("resume-collection");
   

  // post edit-resume information
    app.post('/edit-resume/:email',async(req,res) => {
      const doc = req.body;
      const result = await resumeBuilderResumeCollection.insertOne(doc)
      res.send({result,message:"success"})
    })

  //  users store on mongoDB
   app.put('/users/:email',async (req,res) => {
    const email = req.params.email;
    const user = req.body;
    const filter = {email:email}
    const option = { upsert: true }
    const updatedDoc = {
      $set:user
    }
    const result = await resumeBuilderUsersCollection.updateOne(filter,updatedDoc,option)
    const token = jwt.sign({email:email},process.env.JWT_TOKEN,{
      expiresIn:"1d"
    })

    res.send({result,token,message:"200"})
  }) 
}

finally {
  }
}
run().catch(console.dir);

// server run

app.get("/", (req, res) => {
  res.send("Resume Builder Server");
});

app.listen(port, () => {
  console.log("Listening to port", port);
});
