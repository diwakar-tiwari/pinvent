const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors =  require('cors');
const dotenv = require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 5000;

//connect DB and start server
mongoose
    .connect(process.env.MONGO_URI)
    .then(()=>{
        app.listen(PORT, ()=>{
            console.log(`Server is running at port ${PORT}`);
        })
    }).catch((err)=>console.log(err));