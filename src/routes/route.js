const express=require('express');
const router=express.Router();


router.get('/test-api',(req,res)=>{
    res.send("API is runiggggg")
})


module.exports=router