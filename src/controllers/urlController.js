const urlModel = require("../models/urlModel");
const shortid = require("shortid");
const valid = require("../validation/validators");
const validUrl = require('valid-url')
const redis = require("redis");

const { promisify } = require("util");

//Connect to redis
const redisClient = redis.createClient(
  12538,
  "redis-12538.c212.ap-south-1-1.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);
redisClient.auth("4okMYxBqjrdHQokYaLMKtALtlgrrGGri", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis..");
});



//1. connect to the server
//2. use the commands :

//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

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
      return res.status(400).send({ status: false, message: 'Invalid URL' })
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
    let data=await urlModel.create(requestBody);
    const createUrl = await urlModel.findOne({ shortUrl }).select({ _id: 0, __v: 0, createdAt: 0, updatedAt: 0 });
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

    let cahcedLinkData = await GET_ASYNC(`${req.params.urlCode}`)
    cahcedLinkData = JSON.parse(cahcedLinkData)
    if (cahcedLinkData) {
      return res.status(302).redirect(cahcedLinkData.longUrl);
    } else {
      let fullUrl = await urlModel.findOne({ urlCode: req.params.urlCode });
      await SET_ASYNC(`${req.params.urlCode}`, JSON.stringify(fullUrl))
      return res.status(302).redirect(findUrl.longUrl);
    }
  }
  catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }

};

module.exports = {
  createUrl,
  findUrl
};
