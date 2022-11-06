const express = require("express")
const cors = require("cors")
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
require("dotenv").config()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ltefwui.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const verifyJwt = (req, res, next) => {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(401).send({ message: "Unauthorized User" })
    }
    const token = authHeader.split(" ")[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: "Unauthorized User" })
        }
        req.decoded = decoded
        next()
    })
}

const run = async () => {
    try {
        const geniusCarCollection = client.db("geniusCar").collection("services")
        const orderCollection = client.db("geniusCar").collection("orders")

        app.post("/jwt", (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" })
            res.send({ token })
        })

        app.get("/services", async (req, res) => {
            const query = {}
            const cursor = geniusCarCollection.find(query)
            const services = await cursor.toArray()
            res.send(services)
        })

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const services = await geniusCarCollection.findOne(query)
            res.send(services)
        })

        // Orders Section

        app.get("/orders", verifyJwt, async (req, res) => {
            const decoded = req.decoded

            if (decoded.email !== req.query.email) {
                res.status(403).send({ message: "Unauthorized Access" })
            }
            let query = {}

            if (req.query.email) {
                query = { email: req.query.email }
            }

            const cursor = orderCollection.find(query);
            const orders = await cursor.toArray()
            res.send(orders)
        })

        app.post("/orders", async (req, res) => {
            const order = req.body
            const result = await orderCollection.insertOne(order)
            res.send(result)
        })

        app.patch("/orders/:id", async (req, res) => {
            const id = req.params.id
            const status = req.body.status
            const filter = { _id: ObjectId(id) }
            const updatedOrder = {
                $set: {
                    status: status
                }
            }
            const result = await orderCollection.updateOne(filter, updatedOrder)
            res.send(result)
        })

        app.delete("/orders/:id", async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await orderCollection.deleteOne(query)
            res.send(result)
        })
    }
    finally {

    }
}
run().catch(err => console.error(err))


app.get("/", (req, res) => {
    res.send("Genius Car Server is running")
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})