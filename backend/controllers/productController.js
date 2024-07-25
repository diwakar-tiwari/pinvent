const asyncHandler = require('express-async-handler');
const Product = require('../models/productModel');
const { Error } = require('mongoose');

//create product
const createProduct = asyncHandler(async(req,res)=>{
    const {name, sku,category, quantity, price, description, image } = req.body;

    //validation
    if(!name || !sku || !category || !quantity || !price || !description){
        res.status(400);
        throw new Error("Please enter the required field")
    }

    //create product
    const product = await Product.create({
        user: req.user.id,
        name,
        sku,
        category,
        quantity,
        price,
        description,
        // image
    });

    res.status(200).send(product);
    

});

//Get all product
const getProducts = asyncHandler(async (req, res) => {
    const products = await Product.find({ user: req.user.id }).sort("-createdAt");
    res.status(200).json(products);
  });

//Get single product 
const getProduct = asyncHandler(async(req,res)=>{
    const product = await Product.findById(req.params.id);

    if(!product){
        res.status(404);
        throw new Error("Product not found");
    }

    //match product to its user
    if(product.user.toString()!== req.user.id){
        res.status(401)
        throw new Error("User not authorised")
    }
    res.status(200).json(product);
})

//Delete Product
const deleteProduct = asyncHandler(async(req,res)=>{
    const product = await Product.findById(req.params.id)

    if(!product){
        res.status(404);
        throw new Error("Product not found")
    }

    if(product.user.toString()!== req.user.id){
        res.status(401)
        throw new Error("User not authorised")
    }

    await Product.deleteOne({_id:req.params.id});
    res.status(200).send({message: "Product Deleted"})
})

//update product
const updateProduct = asyncHandler(async(req,res)=>{
    const {name, sku, category, quantity, price, description} = req.body;
    const {id} = req.params;

    const product = await Product.findById(id);

    if(!product){
        res.status(404);
        throw new Error("Product not found")
    }

    if(product.user.toString()!== req.user.id){
        res.status(401)
        throw new Error("User not authorised")
    }

    if(product){
        product.name = req.body.name || name
        product.sku = req.body.sku ||sku
        product.category = req.body.category || category
        product.quantity = req.body.quantity || quantity
        product.price = req.body.price || price
        product.description = req.body.description || description

        const updateProduct = await product.save();
        res.status(200).json(updateProduct
            // {
            // user: updateProduct.id,
            // name: updateProduct.name,
            // sku: updateProduct.sku,
            // category: updateProduct.category,
            // quantity: updateProduct.quantity,
            // price:updateProduct.price,
            // description:updateProduct.description
            // }
        )
    }else{
        res.status(404);
        throw new Error("Product not found")
    }


    
})

module.exports ={
    createProduct,
    getProducts,
    getProduct,
    deleteProduct,
    updateProduct
}