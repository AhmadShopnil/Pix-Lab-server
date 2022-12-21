const express = require('express');
const cors = require('cors')
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const jwt = require('jsonwebtoken');



app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.tus40xp.mongodb.net/?retryWrites=true&w=majority`
const client = new MongoClient(uri)


function verifyJWT(req, res, next) {
    // console.log(req.headers.authorization)
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.status(401).send({ message: 'Unauthorization User!!' })
    }
    const token = authHeader.split(' ')[1]

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (error, decoded) {
        if (error) {
            res.status(403).send({ message: 'Invalid Token!' })

        }
        else {
            req.decoded = decoded
            next();
        }


    })

}


const run = async () => {
    try {
        await client.connect()
        console.log('database connected')
    }
    catch (error) {
        console.log(error.name, error.message, error.stack)
        res.send({
            status: false,
            error: error.message
        })
    }
}
run();

const serviceCollection = client.db('pixLab').collection('services')
const reviewsCollection = client.db('pixLab').collection('reviews')


app.post('/jwt', async (req, res) => {
    try {
        const user = req.body;
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30d' })
        res.send({ token })
        // res.send(user)
    } catch (error) {

    }
})


app.post('/reviews', async (req, res) => {
    try {
        const review = req.body
        const result = await reviewsCollection.insertOne(review)

        if (result.insertedId) {
            res.send({
                status: true,
                message: `Successfully create Review`
            })
        }
        else {
            res.send({
                status: false,
                error: `Failed to create review`
            })
        }

    } catch (error) {
        console.log(error.name, error.message, error.stack)
        res.send({
            status: false,
            error: error.message
        })
    }
})


app.post('/services', async (req, res) => {
    try {
        const service = req.body
        const result = await serviceCollection.insertOne(service)

        if (result.insertedId) {
            res.send({
                status: true,
                message: `Successfully create service`
            })
        }
        else {
            res.send({
                status: false,
                error: `Failed to create Service`
            })
        }

    } catch (error) {
        console.log(error.name, error.message, error.stack)
        res.send({
            status: false,
            error: error.message
        })
    }
})


app.get('/services', async (req, res) => {
    try {
        const query = {}
        const cursor = serviceCollection.find(query).sort({ time: -1 })
            ;
        const services = await cursor.toArray()
        res.send({
            status: true,
            data: services
        })

    } catch (error) {
        console.log(error.name, error.message)
        res.send({
            status: false,
            error: error.message
        })
    }
})

app.get('/homeservices', async (req, res) => {
    try {
        const query = {}
        const cursor = serviceCollection.find(query).sort({ time: -1 });
        const services = await cursor.limit(3).toArray()
        res.send({
            status: true,
            data: services
        })

    } catch (error) {
        console.log(error.name, error.message)
        res.send({
            status: false,
            error: error.message
        })
    }
})


app.get('/services/:id', async (req, res) => {

    try {
        const id = req.params.id
        const query = { _id: ObjectId(id) }
        const services = await serviceCollection.findOne(query)
        res.send({
            status: true,
            data: services
        })

    } catch (error) {
        console.log(error.name, error.message, error.stack)
        res.send({
            status: false,
            error: error.message
        })
    }
})


app.get('/reviews/:id', async (req, res) => {
    const id = req.params.id

    try {

        const cursor = reviewsCollection.find({ serviceId: id })
        const reviews = await cursor.toArray()

        res.send({
            status: true,
            data: reviews
        })

    } catch (error) {
        console.log(error.name, error.message)
        res.send({
            status: false,
            error: error.message
        })
    }
})


app.get('/myReviews', verifyJWT, async (req, res) => {

    const decoded = req.decoded;

    if (decoded.email != req.query.email) {
        res.status(403).send('Forbidden Access')
    }

    const email = req.query.email

    try {
        const cursor = reviewsCollection.find({ userEmail: email })
        const reviews = await cursor.toArray()


        res.send({
            status: true,
            data: reviews
        })

    } catch (error) {
        console.log(error.name, error.message, error.stack)
        res.send({
            status: false,
            error: error.message
        })
    }
})


app.delete('/reviews/:id', async (req, res) => {

    try {
        const id = req.params.id;
        const query = { _id: ObjectId(id) }
        const result = await reviewsCollection.deleteOne(query)


        res.send({
            status: true,
            message: "Delete User Successfully"
        })
    } catch (error) {
        console.log(error.name, error.message, error.stack)
    }
})


app.put('/reviews/:id', async (req, res) => {

    try {
        const id = req.params.id;
        const review = req.body
        const { text } = review

        const result = await reviewsCollection.updateOne({ _id: ObjectId(id) }, { $set: { text: text } })
        if (result.modifiedCount) {

            res.send({
                status: true
            })
        }

    } catch (error) {
        console.log(error.name, error.message)
    }
})


app.get('/', (req, res) => {
    res.send('pixLab server is running')
})
app.listen(port, (req, res) => {
    console.log(`Server is rouning on port ${port}`)
})