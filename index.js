const express = require("express");
const app = express();
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

// MIDDLEWARE
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ctziwlh.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const menuCollection = client.db("foodBistroDB").collection("menu");
const reviewsCollection = client.db("foodBistroDB").collection("reviews");
const cartCollection = client.db("foodBistroDB").collection("cart");
const userCollection = client.db("foodBistroDB").collection("users");

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// jwt related apis ----------------------------------

// post jwt
app.post("/jwt", async (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.ACCESS_SECRET_TOKEN, {
    expiresIn: "1h",
  });
  res.send({ token });
});

const verifyToken = (req, res, next) => {
  console.log("inside verify token", req.headers.authorization);
  if (!req.headers.authorization) {
    return res.status(401).send({ message: "forbidden access" });
  }
  const token = req.headers.authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "forbidden access" });
    }
    req.decoded;
    next();
  });
};

// user related apis ------------------------------------------

// get users
app.get("/users", verifyToken, async (req, res) => {
  const result = await userCollection.find().toArray();
  res.send(result);
});

// post a new user
app.post("/users", async (req, res) => {
  const user = req.body;
  const query = { email: user.email };
  const existingUser = await userCollection.findOne(query);
  if (existingUser) {
    return res.send({ message: "User already exist", insertedId: null });
  }
  const result = await userCollection.insertOne(user);
  res.send(result);
});

// delete a user
app.delete("/users/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await userCollection.deleteOne(query);
  res.send(result);
});

// update user role Admin
app.patch("/users/admin/:id", async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const updatedDoc = {
    $set: {
      role: "admin",
    },
  };
  const result = await userCollection.updateOne(filter, updatedDoc);
  res.send(result);
});

// menu related apis ---------------------------------------------

// get menu
app.get("/menu", async (req, res) => {
  const cursor = menuCollection.find();
  const result = await cursor.toArray();
  res.send(result);
});

// reviews related apis -----------------------------------------

//  get reviews
app.get("/reviews", async (req, res) => {
  const cursor = reviewsCollection.find();
  const result = await cursor.toArray();
  res.send(result);
});

// shopping cart related api -------------------------------

// get cart data
app.get("/carts", async (req, res) => {
  const email = req.query.email;
  const query = { email: email };
  const result = await cartCollection.find(query).toArray();
  res.send(result);
});

// post a cart
app.post("/carts", async (req, res) => {
  const cartItem = req.body;
  const result = await cartCollection.insertOne(cartItem);
  res.send(result);
});

app.delete("/carts/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await cartCollection.deleteOne(query);
  res.send(result);
});

// home ------------------------------------------------

app.get("/", (req, res) => {
  res.send("Food Bistro Server");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
