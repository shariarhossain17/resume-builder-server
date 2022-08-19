const express = require("express");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const stripe = require("stripe")(process.env.PAYMENT_API_KEY);

// userName database  :
// password database:
const app = express();

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.RESUME_BUILDER}:${process.env.RESUME_BUILDER_PASS}@cluster0.ozvnhci.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// verify jwt function
const verifyJwt = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unAuthorize access" });
  }
  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.JWT_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "forbidden access" });
    }
    if (decoded) {
      req.decoded = decoded;
      next();
    }
  });
};

// backend all code
const run = async () => {
  try {
    await client.connect();
    console.log("db-connect");

    // collection
    const resumeBuilderUsersCollection = client
      .db("Resume_Builder")
      .collection("users");
    const resumeBuilderResumeCollection = client
      .db("Resume_Builder")
      .collection("resume-collection");
    const resumeBuilderService = client
      .db("Resume_Builder")
      .collection("Services");
    const resumeBuilderServiceBooking = client
      .db("Resume_Builder")
      .collection("booking");

    const coverLetterInfoCollection = client
      .db("coverLetterInfo")
      .collection("CL_info");

    // post edit-resume information
    app.post("/edit-resume/:email", async (req, res) => {
      const doc = req.body;
      const result = await resumeBuilderResumeCollection.insertOne(doc);
      res.send({ result, message: "success" });
    });

    //  users store on mongoDB
    app.put("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const option = { upsert: true };
      const updatedDoc = {
        $set: user,
      };
      const result = await resumeBuilderUsersCollection.updateOne(
        filter,
        updatedDoc,
        option
      );
      const token = jwt.sign({ email: email }, process.env.JWT_TOKEN);

      res.send({ result, token, message: "200" });
    });
    /*  Shariar api*/
    // single service query by id

    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await resumeBuilderService.findOne(query);
      res.send(result);
    });

    // get-all-service
    app.get("/services", async (req, res) => {
      const result = await resumeBuilderService.find().toArray();
      res.send(result);
    });

    // booking service
    app.post("/booking", async (req, res) => {
      const booking = req.body;
      const result = await resumeBuilderServiceBooking.insertOne(booking);
      res.send(result);
    });

    // payment api
    app.post("/create-payment-intent", verifyJwt, async (req, res) => {
      const service = req.body;
      const price = service.price;

      if (price) {
        const amount = price * 100;
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency: "usd",
          payment_method_types: ["card"],
        });

        res.send({
          clientSecret: paymentIntent.client_secret,
        });
      }
    });

    // set coverLetter information in database
    app.put("/coverLetterInfo/:email", verifyJwt, async (req, res) => {
      const userEmail = req.params.email;
      const filter = { userEmail };
      const coverLetterInfo = req?.body;

      const options = { upsert: true };
      const updateDoc = {
        $set: coverLetterInfo,
      };
      const result = await coverLetterInfoCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    // Get coverLetter information
    app.get("/coverLetterInfo/:id", verifyJwt, async (req, res) => {
      const userEmail = req.params.id;
      const query = { userEmail };
      const result = await coverLetterInfoCollection.findOne(query);
      res.send(result);
    });
  } finally {
    // finally
  }
};
run().catch(console.dir);

// server run

app.get("/", (req, res) => {
  res.send("Resume Builder Server");
});

app.listen(port, () => {
  console.log("Listening to port", port);
});
// nothing
