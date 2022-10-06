const express=require('express');
const router=express.Router();
const urlController=require('../controllers/urlController')

router.get('/test-api',(req,res)=>{
    res.send("API is runiggggg")
})

router.post('/url/shorten',urlController.createUrl)
router.get('/:urlCode',urlController.findUrl)


//errorHandling for wrong address
router.all("/**", function (_, res) {
    res.status(400).send({
        status: false,
        msg: "The api you request is not available"
    })
})

module.exports=router