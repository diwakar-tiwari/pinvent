const asyncHandler = require('express-async-handler');
const User = require('../models/userModel')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Token = require('../models/tokenModel');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
sendEmail


const generateToken = (id) =>{
    return jwt.sign({id},process.env.JWT_SECRET, {expiresIn:"1d"})
}


//Register user
const registerUser = asyncHandler( async(req,res) =>{
        
        const {name, email, password} = req.body;
        //validation
        if(!name || !email || !password){
            
            res.status(400)
            throw new Error("Please fill the required fields");
        }

        if(password.length<6){
            res.status(400)
            throw new Error("Password length should not be less than 6");
        }

        //check if user already exist
        const userExists = await User.findOne({email})
        if(userExists){
            res.status(400)
            throw new Error("This Email has already been registered");
        }


        //create new user
        const user = await User.create({
            name,
            email,
            password,
        })

        //Generating a token
        const token = generateToken(user._id)

        // Send HTTP-only cookie
        res.cookie("token", token, {
            path:"/",
            httpOnly:true,
            expires: new Date(Date.now() + 1000 * 86400), //1 day
            sameSite: "none",
            secure:true,
        });
 
        if(user){
            const {_id, name, email, photo, phone, bio} = user
            res.status(201).json({
                _id, name, email, photo, phone, bio, token  
            });
        }else{
            res.status(400)
            throw new Error("Invalid user data ")
        }
});

//Login user
const loginUser = asyncHandler(async (req, res) =>{
    const {email, password} = req.body;

    //validate field
    if(!email || !password){
        res.send("Please enter all the field")
    }

    //check if user exists by email
    const user = await User.findOne({email})

    if(!user){
        res.status(400)
        throw new Error("User Not Found, Register now")
    }

    //check password is correct or not
    const isPassCorrect = await bcrypt.compare(password, user.password);

    //Generating a token
    const token = generateToken(user._id)

    // Send HTTP-only cookie
    res.cookie("token", token, {
        path:"/",
        httpOnly:true,
        expires: new Date(Date.now() + 1000 * 86400), //1 day
        sameSite: "none",
        secure:true,
    });

    if(user && isPassCorrect){
        const { _id, name, email, photo, phone, bio } = user;
        res.status(200).json({
        _id,
        name,
        email,
        photo,
        phone,
        bio,
        token,
        });
    }else{
        res.status(400)
        throw new Error("Invalid email or password")
    }

});

//Logout user
const logout = asyncHandler(async(req, res)=>{
    res.cookie("token", "", {
        path:"/",
        httpOnly:true,
        expires: new Date(0), 
        sameSite: "none",
        secure:true,
    });
    return res.status(200).json({message:"Logged out successfully"})
});

//Get user
const getUser = asyncHandler(async(req, res)=>{
    const user = await User.findById(req.user._id);

    if (user) {
        const { _id, name, email, photo, phone, bio } = user;
        res.status(200).json({
        _id,
        name,
        email,
        photo,
        phone,
        bio,
        });
  } else {
    res.status(400);
    throw new Error("User Not Found");
  }
})

//get login status
const loginStatus = asyncHandler(async(req,res)=>{
    

    //Generating a token
    const token = req.cookies.token;

    if(!token){
        return res.json(false)
    }

    // Verify Token
    const verified = jwt.verify(token, process.env.JWT_SECRET);

    if(verified){
        return res.json(true)
    }

    return res.json(false)

})

//update user
const updateUser = asyncHandler(async(req, res)=>{
    const user = await User.findById(req.user._id);

    if(user){
        const {name, email, photo, phone, bio } = user;
        user.email = email;
        user.name = req.body.name || name;
        user.photo = req.body.photo || photo;
        user.phone = req.body.phone || phone;
        user.bio = req.body.bio || bio;
    

    const updateUser = await user.save();
        res.status(200).json({
            _id: updateUser._id,
            name: updateUser.name,
            email: updateUser.email,
            photo: updateUser.photo,
            phone: updateUser.phone,
            bio: updateUser.bio
        });
    } else{
        res.status(404);
        throw new Error("User not found")
    }


})

//change password
const changePassword = asyncHandler(async(req,res) =>{
    const user = await User.findById(req.user._id)
    const {oldPassword, password} = req.body;

    if(!user){
        res.status(404);
        throw new Error("User not found, Signup please")
    }
    //validate
    if(!oldPassword || !password){
        res.status(404);
        throw new Error("Enter the old and new password")
    }

    //check if oldPassword matches password in DB
    const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password)

    if(user && passwordIsCorrect){
        user.password = password;
        await user.save();
        res.status(200).send("Password changed successfully")
    }else{
        res.status(400);
        throw new Error("Old Password is not correct")
    }

})

//Forgot password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error("User does not exist");
  }

  // Delete token if it exists in DB
  let token = await Token.findOne({ userId: user._id });
  if (token) {
    await token.deleteOne();
  }

  // Create Reset Token
  let resetToken = crypto.randomBytes(32).toString("hex") + user._id;
  console.log(resetToken);

  // Hash token before saving to DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Save Token to DB
  await new Token({
    userId: user._id,
    token: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * (60 * 1000), // Thirty minutes
  }).save();

  // Construct Reset Url
  const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

  // Reset Email
  const message = `
      <h2>Hello ${user.name}</h2>
      <p>Please use the url below to reset your password</p>  
      <p>This reset link is valid for only 30minutes.</p>
      <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
      <p>Regards...</p>
      <p>Diwakar Tiwari</p>
    `;
  const subject = "Password Reset Request";
  const send_to = user.email;
  const sent_from = process.env.EMAIL_USER;

  try {
    await sendEmail(subject, message, send_to, sent_from);
    res.status(200).json({ success: true, message: "Reset Email Sent" });
  } catch (error) {
    res.status(500);
    throw new Error("Email not sent, please try again");
  }
});

// Reset Password
const resetPassword = asyncHandler(async (req, res) => {
    const { password } = req.body;
    const { resetToken } = req.params;
  
    // Hash token, then compare to Token in DB
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
  
    // fIND tOKEN in DB
    const userToken = await Token.findOne({
      token: hashedToken,
      expiresAt: { $gt: Date.now() },
    });
  
    if (!userToken) {
      res.status(404);
      throw new Error("Invalid or Expired Token");
    }
  
    // Find user
    const user = await User.findOne({ _id: userToken.userId });
    user.password = password;
    await user.save();
    res.status(200).json({
      message: "Password Reset Successful, Please Login",
    });
  });

module.exports={
    registerUser,
    loginUser,
    logout,
    getUser,
    loginStatus,
    updateUser,
    changePassword,
    forgotPassword,
    resetPassword
}