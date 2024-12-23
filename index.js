const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
require("dotenv").config();
const cors = require("cors");
const app = express();

const port = process.env.PORT || 5000;
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.7auoehb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
console.log(uri);

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const ProductCollection = client.db("Ecommerce").collection("Jns_Product");
    const ProductUpload = client
      .db("Ecommerce")
      .collection("seller_uploadProduct");

    app.get("/Jns_Product", async (req, res) => {
      const cursor = ProductCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.post("/Jns_Product", async (req, res) => {
      try {
        const { image } = req.body;

        if (!image) {
          return res.status(400).json({ message: "Image URL is required" });
        }

        // Search for a product with the matching image URL
        const results = await ProductCollection.find({ image: image });

        if (results.length > 0) {
          return res.status(200).json({ results });
        } else {
          return res
            .status(403)
            .json({ message: "No matching products found" });
        }
      } catch (error) {
        console.error("Error searching for products:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    });

    //new product
    app.post("/seller_uploadProduct", async (req, res) => {
      const uploadProducts = req.body;
      console.log(uploadProducts);
      const result = await ProductUpload.insertOne(uploadProducts);
      res.send(result); // You might want to send a more informative response here
    });

    app.get("/seller_uploadProduct", async (req, res) => {
      const cursor = ProductUpload.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/seller_uploadProduct/:id", async (req, res) => {
      const { id } = req.params;

      try {
        console.log("Approving product with ID:", id);

        const result = await ProductUpload.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status: "Approved" } }
        );

        console.log("Update result:", result);

        if (result.modifiedCount > 0) {
          res.status(200).json({ message: "Product approved successfully" });
        } else {
          res.status(404).json({ message: "Product not found" });
        }
      } catch (error) {
        console.error("Error approving product:", error);
        res.status(500).json({ message: "Error approving product", error });
      }
    });

    app.delete("/seller_uploadProduct/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await ProductUpload.deleteOne(query);
      res.send(result);
    });
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
