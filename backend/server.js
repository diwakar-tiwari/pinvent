const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors =  require('cors');
const dotenv = require('dotenv').config();
const userRoute = require('./routes/userRoute')
const productRoute = require('./routes/productRoute')
const errorHandler = require('./middleware/errorMiddleware')
const cookieParser = require('cookie-parser')


const app = express();

//Middlewares
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({extended:false}))
app.use(bodyParser.json())

//Route Middleware
app.use("/api/users",userRoute)
app.use("/api/products", productRoute);

//Routes
app.get("/home",(req,res)=>{
    res.send("Home Page");
})

//Error Middleware
app.use(errorHandler); 





//connect DB and start server
const PORT = process.env.PORT || 5000;
mongoose
    .connect(process.env.MONGO_URI)
    .then(()=>{
        app.listen(PORT, ()=>{
            console.log(`Server is running at port ${PORT}`);
        })
}).catch((err)=>console.log(err));