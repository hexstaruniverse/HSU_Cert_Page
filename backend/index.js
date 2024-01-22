require('dotenv').config()
const { MongoClient } = require('mongodb')
const express = require('express')
const cors = require('cors')
const shortid = require('shortid')

const uri = process.env.MONGO_URI
const client = new MongoClient(uri);
const app = express()

const allowedOrigins = [
    'http://localhost:3000'
];

app.use(cors({
    origin:function(origin,callback){
        if(allowedOrigins.indexOf(origin)!== -1 || !origin){
            callback(null,true);
        }
        else{
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials:true,
}))

//middleware
app.use(express.json())

app.use((req, res, next) => {
    console.log(req.method, req.url)
    next()
})

app.listen(process.env.PORT, () => {
    console.log(`Process Running on Port : ${process.env.PORT}`)
})

app.post('/', async (req, res) => {
    
    const { Name, Email, CS_Name
    } = req.body
    
    try {
        await client.connect()
        const database = client.db()
        const collection = database.collection('student_data')

        if(!Name || !Email || !CS_Name
            ) {
            throw Error("All Fields must be filled!")
        }

        const mail = await collection.findOne({Email})
        const stu_name = await collection.findOne({Name: Name.toUpperCase()})
        const course = await collection.findOne({CS_Name
        })

        if(!mail) {
            throw Error('Email ID not found!')
        }

        if(!stu_name) {
            throw Error('Name not found!')
        }

        if(!course) {
            throw Error('Student not found for this course!')
        }

        if(mail.hasOwnProperty('Cert_ID') === true) {
            throw Error('Certificate Already Generarted!')
        }

        const document = await collection.findOne({ _id: 1, _id: { $not: { $type: 'objectId' } } });
        var count = document.count
        let countString = count.toString().padStart(3, '0');

        var Cert_ID = shortid.generate() + new Date().getFullYear()+countString
        await collection.findOneAndUpdate({_id: document._id} ,{'$set': {count: count + 1}})
        await collection.findOneAndUpdate({_id: mail._id}, {"$set":{ Cert_ID }})
        
        res.status(200).json({Name: mail.Name, Cert_ID})
        
    } catch (error) {
        res.status(400).json({error: error.message})
    } finally {
        await client.close()
    }
})


