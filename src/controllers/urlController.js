const urlModel = require("../models/urlModel");
const shortid = require("shortid");
const valid = require("../validation/validators");
const validUrl = require('valid-url')
const redis = require("redis");

const { promisify } = require("util");

//Connect to redis
const redisClient = redis.createClient(
  15349,
  "redis-15349.c305.ap-south-1-1.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);
redisClient.auth("efy1fmMnnF1cb6qO4Uqn7aeEfycP8qyT", function (err) {
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

    //validate uniqueness of longUrl
    //find longUrl in cahedData
    let cahcedLinkData = await GET_ASYNC(`${longUrl}`)
    cahcedLinkData = JSON.parse(cahcedLinkData)

    if (cahcedLinkData) {
      return res.status(409).send({ status: false, message: "LongUrl already shorted....", shortUrl: cahcedLinkData.shortUrl });
    } else {
      let uniqueUrl = await urlModel.findOne({ longUrl });
      await SET_ASYNC(`${longUrl}`, JSON.stringify(uniqueUrl))
      if (uniqueUrl) {
        return res.status(409).send({ status: false, message: "LongUrl already shorted", shortUrl: uniqueUrl.shortUrl });
      }
    }

    //generate shortId and add in requestBody
    let urlCode = shortid.generate();
    requestBody.urlCode = urlCode;

    //create shortUrl and add in requestBody
    let shortUrl = `http://localhost:3000/${urlCode}`;
    requestBody.shortUrl = shortUrl;

    //validate uniqueness of sortId
    //find sortId in cahedData
    let cahcedSort = await GET_ASYNC(`${urlCode}`)
    if (cahcedSort) {
      return res.status(409).send({ status: false, message: "shortid already present in cahedData...." });
    } else {
      let uniqueSort = await urlModel.findOne({urlCode });
      await SET_ASYNC(`${urlCode}`, JSON.stringify(uniqueSort))
      if (uniqueSort) {
        return res.status(409).send({ status: false, message: "shortid already present in db" });
      }
    }

    //create document amd send response
    let data=await urlModel.create(requestBody);
    //await SET_ASYNC(`${data}`, JSON.stringify(data))
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

    //validation for urlCode
    if (!shortid.isValid(urlCode)) {
      return res.status(400).send({ status: false, message: "Invalid urlCode" });
    }

    //find urlCode in cahedData
    let cahcedLinkData = await GET_ASYNC(`${urlCode}`)
    cahcedLinkData = JSON.parse(cahcedLinkData)

    //redirect to longUrl
    if (cahcedLinkData) {
      return res.status(302).redirect(cahcedLinkData.longUrl);
    } else {
      let fullUrl = await urlModel.findOne({ urlCode: urlCode });
      if (!fullUrl) {
        return res.status(404).send({ status: false, message: "ShortUrl not found" });
      }
      await SET_ASYNC(`${urlCode}`, JSON.stringify(fullUrl))
      return res.status(302).redirect(fullUrl.longUrl);
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
