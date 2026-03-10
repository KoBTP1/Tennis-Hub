require("dotenv").config()
const express = require("express")
const connectDB = require("./src/config/db.js")

const app = express()

app.use(express.json())

connectDB()

app.get("/", (req, res) => {
    res.send("TennisHub API running")
})

app.listen(process.env.PORT, () => {
    console.log("Server running")
})