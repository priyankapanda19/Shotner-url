const urlModel = require("../models/urlModel");
const shortid = require("shortid");
const valid = require("../validation/validators");
const validUrl = require('valid-url')


const createUrl = async (req, res) => {
  try {
    const requestBody = req.body;
    const { longUrl } = requestBody;

    //validation for emptyBody
    if (Object.keys(requestBody).length == 0) {
      return res.status(400).send({ status: false, message: "Please enter some input" });
    }

    //validation for longUrl
    if (!valid.isEmpty(longUrl)) {
      return res.status(400).send({ status: false, message: "longUrl is mandatory" });
    }
    if (!validUrl.isUri(longUrl)) {
      return res.status(400).send({ status: false, message: 'Invalid base URL' })
    }
    let uniqueUrl = await urlModel.findOne({ longUrl });
    if (uniqueUrl) {
      return res.status(409).send({ status: false, message: "LongUrl already shorted", shortUrl: uniqueUrl.shortUrl });
    }

    //generate shortId and add in requestBody
    let sort = shortid.generate();
    requestBody.urlCode = sort;

    //validate uniqueness of urlCode
    let uniqueUrlCode = await urlModel.findOne({ urlCode: sort });
    if (uniqueUrlCode) {
      return res.status(400).send({ status: false, message: "urlCode already exist" });
    }

    //create shortUrl and add in requestBody
    let shortUrl = `http://localhost:3000/${sort}`;
    requestBody.shortUrl = shortUrl;

    //create document amd send response
    await urlModel.create(requestBody);
    const createUrl = await urlModel.findOne({ shortUrl }).select({ _id: 0, __v: 0 });
    return res.status(201).send({ status: true, date: createUrl });

  }
  catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }

};




const findUrl = async (req, res) => {
  try {
    const urlCode = req.params.urlCode;

    const findUrl = await urlModel.findOne({ urlCode });
    if (!findUrl) {
      return res.status(404).send({ status: false, message: "shortUrl not found" });
    }

    //redirect to longUrl
    return res.status(302).redirect(findUrl.longUrl);

  }
  catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

module.exports = {
  createUrl,
  findUrl,
};
