const express = require("express");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const e = require("express");
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
async function run() {
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
    const resumeBuilderUserReview = client
      .db("Resume_Builder")
      .collection("review");
    const resumeBuilderBlog = client.db("Resume_Builder").collection("Blog");

    const coverLetterInfoCollection = client
      .db("coverLetterInfo")
      .collection("CL_info");

    // const verify admin
    const verifyAdmin = async (req, res, next) => {
      const decoded = req.decoded.email;
      const filter = { email: decoded };
      const admin = await resumeBuilderUsersCollection.findOne(filter);
      if (admin.role === "admin") {
        next();
      } else {
        return res.status(403).send({ message: "forbidden access" });
      }
    };

    /*  Shariar api*/

    // single user
    app.get("/single/user/:email", verifyJwt, async (req, res) => {
      const email = req.params.email;
      const result = await resumeBuilderUsersCollection.findOne({
        email: email,
      });
      res.send(result);
    });

    // user profile updated
    app.patch("/profile/update/:email", verifyJwt, async (req, res) => {
      const email = req.params.email;
      const updateProfile = req.body;
      const filter = { email: email };
      const updatedDoc = {
        $set: updateProfile,
      };
      const result = await resumeBuilderUsersCollection.updateOne(
        filter,
        updatedDoc
      );
      res.send(result);
    });
    // user photo  upload and updated

    app.patch("/user/image/:email", verifyJwt, async (req, res) => {
      const email = req.params.email;
      const img = req.body;
      const filter = { email: email };
      const updatedDoc = {
        $set: img,
      };

      const result = await resumeBuilderUsersCollection.updateOne(
        filter,
        updatedDoc
      );
      res.send(result);
    });
    // all blogs
    app.get("/all-blog", async (req, res) => {
      const filter = req.query;
      if (filter === filter) {
        const resume = await (
          await resumeBuilderBlog.find(filter).toArray()
        ).reverse();
        return res.send(resume);
      }
      const result = await (await resumeBuilderBlog.find().toArray()).reverse();
      res.send(result);
    });
    // edit blog post
    app.patch("/blog/:id", verifyJwt, async (req, res) => {
      const updateBlog = req.body;
      console.log(updateBlog);
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: updateBlog,
      };

      const result = await resumeBuilderBlog.updateOne(filter, updatedDoc);
      res.send(result);
    });
    // single blog post
    app.get("/blog/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await resumeBuilderBlog.findOne(filter);
      res.send(result);
    });

    // delete blog post

    app.delete("/blogs/:id", verifyJwt, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await resumeBuilderBlog.deleteOne(filter);
      res.send(result);
    });

    // blog post query by email

    app.get("/blogs/:email", verifyJwt, async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const result = await resumeBuilderBlog.find({ email: email }).toArray();
      res.send(result);
    });

    // Blog api
    app.post("/blogs", verifyJwt, async (req, res) => {
      const blog = req.body;
      const result = await resumeBuilderBlog.insertOne(blog);
      res.send(result);
    });

    // all review api

    app.get("/reviews", async (req, res) => {
      const result = await (
        await resumeBuilderUserReview.find().toArray()
      ).reverse();
      res.send(result);
    });

    // Review post api
    app.post("/reviews", verifyJwt, async (req, res) => {
      const review = req.body;
      const result = await resumeBuilderUserReview.insertOne(review);
      res.send(result);
    });
    // user order
    app.get("/order/:email", verifyJwt, async (req, res) => {
      const email = req.params.email;
      const result = await resumeBuilderServiceBooking
        .find({ email: email })
        .toArray();
      res.send(result);
    });
    // remove admin
    app.patch(
      "/remove-admin/:email",
      verifyJwt,
      verifyAdmin,
      async (req, res) => {
        const email = req.params.email;
        const filter = { email: email };
        const updatedDoc = {
          $set: {
            role: "",
          },
        };
        const result = await resumeBuilderUsersCollection.updateOne(
          filter,
          updatedDoc
        );
        res.send(result);
      }
    );
    // all admin
    app.get("/admin", verifyJwt, verifyAdmin, async (req, res) => {
      const role = req.query;
      if (role === role) {
        const query = await resumeBuilderUsersCollection.find(role).toArray();
        return res.send(query);
      }
    });
    // secure admin api
    app.get("/admin/:email", verifyJwt, async (req, res) => {
      const email = req.params.email;
      const admin = await resumeBuilderUsersCollection.findOne({
        email: email,
      });
      const isAdmin = admin.role == "admin";
      res.send(isAdmin);
    });
    // create admin
    app.put("/users/admin/:email", verifyJwt, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const updatedDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await resumeBuilderUsersCollection.updateOne(
        query,
        updatedDoc
      );
      res.send(result);
    });
    // secure expert
    app.get("/expert/:email", async (req, res) => {
      const email = req.params.email;
      const expert = await resumeBuilderUsersCollection.findOne({
        email: email,
      });
      const isExpert = expert.writer == "expert";
      res.send(isExpert);
    });
    // remove expert
    app.patch(
      "/remove-expert/:email",
      verifyJwt,
      verifyAdmin,
      async (req, res) => {
        const email = req.params.email;
        const filter = { email: email };
        const updatedDoc = {
          $set: {
            writer: "",
          },
        };
        const result = await resumeBuilderUsersCollection.updateOne(
          filter,
          updatedDoc
        );
        res.send(result);
      }
    );

    // get all expert
    app.get("/expert", verifyJwt, verifyAdmin, async (req, res) => {
      const writer = req.query;
      if (writer === writer) {
        const query = await resumeBuilderUsersCollection.find(writer).toArray();
        return res.send(query);
      }
    });
    // create expert
    app.put(
      "/users/expert/:email",
      verifyJwt,
      verifyAdmin,
      async (req, res) => {
        const email = req.params.email;
        const query = { email: email };
        const updatedDoc = {
          $set: {
            writer: "expert",
          },
        };
        const result = await resumeBuilderUsersCollection.updateOne(
          query,
          updatedDoc
        );
        res.send(result);
      }
    );

    // get all user
    app.get("/all-users", verifyJwt, async (req, res) => {
      const email = req.query;
      if (email === email) {
        const query = await resumeBuilderUsersCollection.find(email).toArray();
        return res.send(query);
      }
      const users = await resumeBuilderUsersCollection.find().toArray();
      res.send(users);
    });

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

    // get all booking
    app.get("/booking-service", verifyJwt, verifyAdmin, async (req, res) => {
      const result = await resumeBuilderServiceBooking.find().toArray();
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

    // ifty vai api

    // set coverLetter information in database
    app.put("/coverLetterInfo/:email", verifyJwt, async (req, res) => {
      const userEmail = req.params.email;
      const filter = { userEmail };
      const coverLetterInfo = req?.body;
      console.log(filter, coverLetterInfo);
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
