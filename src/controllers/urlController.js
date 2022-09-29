const urlModel = require('../models/urlModel');
const shortid = require('shortid');
const valid = require('../validation/validators')


const createUrl = async (req, res) => {
    try {
        const requestBody = req.body;
        const longUrl = requestBody.longUrl
        if (Object.keys(requestBody).length == 0){ 
            return res.status(400).send({ status: false, message: "Please enter some input" })
        }
        if (valid.isEmpty(longUrl)) {
            return res.status(400).send({ status: false, message:"longUrl is mandatory"})
        }
        let sort = shortid.generate()
        requestBody.urlCode = sort
        let sortu = (`http://localhost:3000/${sort}`)
        requestBody.shortUrl = sortu
        await urlModel.create(requestBody)
        const createUrl = await urlModel.findOne({ shortUrl: sortu }).select({ __v: 0 })
        return res.status(201).send({ status: true, date: createUrl })

    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}


const findUrl = async (req, res) => {
    try {
        const requestBody = req.params.urlCode;

        const findUrl = await urlModel.findById(requestBody)
        return res.redirect(findUrl.longUrl)

    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}



module.exports = {
    createUrl,
    findUrl
}