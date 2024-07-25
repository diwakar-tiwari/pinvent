const mongoose = require("mongoose");
const bcrypt = require('bcryptjs')



const userSchema = mongoose.Schema({
    name:{
        type: String,
        required: [true,"Please enter your name"]
    },
    email:{
        type: String,
        required: [true,"Please enter your email"],
        unique: true,
        trim: true, //remove empty space from or around the email
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            "Please enter a valid email"

        ]
    },
    password:{
        type: String,
        required: [true, "Please enter your password"],
        minLength: [6, "Password must contain atleast 6 character"],
        // maxLength: [23, "Password length should not be more than 23 character"]
    },
    photo: {
        type: String,
        required: [true, "Please enter your photo"],
        default:"https://i.ibb.co/4pDNDk1/avatar.png"
    },
    phone:{
        type: String,
        default: "+91"
    },
    bio:{
        type: String,
        maxLength: [250, "Bio should not be more than 250 character"],
        default: "bio"
    }
},
{
    timestamps: true
})


//encrypt the password before saving to DB
userSchema.pre("save",async function(next){

    if(!this.isModified("password")){
        return next();
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(this.password,salt)
    this.password =hashedPassword
    next();
})

const User = mongoose.model("User",userSchema)
module.exports = User