const urlModel = require('../models/urlModel');


const createUrl = async (req, res) => {
    try {
        const requestBody = req.body;

        const createUrl = await urlModel.create(requestBody)
        return res.status(201).send({ status: true, date: createUrl })

    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}