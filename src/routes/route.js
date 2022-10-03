const express=require('express');
const router=express.Router();
const urlController=require('../controllers/urlController')

router.get('/test-api',(req,res)=>{
    res.send("API is runiggggg")
})

router.post('/url/shorten',urlController.createUrl)
router.get('/:urlCode',urlController.findUrl)
module.exports=router