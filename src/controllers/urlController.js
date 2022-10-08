const urlModel = require("../models/urlModel");
const shortid = require("shortid");
const axios = require('axios')
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
  console.log("Redis Connected Succesfilly....");
});

//Connection setup for redis
const SET_ASYNC = promisify(redisClient.SETEX).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

const isEmpty = (value) => {
  if (typeof value === "undefined" || value === null) return false;
  if (typeof value === "string" && value.trim().length === 0) return false;
  return true;
};


const createUrl = async (req, res) => {
  try {
    const requestBody = req.body;
    const { longUrl } = requestBody;

    //validation for emptyBody
    if (Object.keys(requestBody).length == 0) {
      return res.status(400).send({ status: false, message: "Please Enter Some Input" });
    }

    if (!isEmpty) {
      return res.status(400).send({ status: false, message: "longUrl Is Mandatory" });
    }

    //validation for invalid Url
    let option = {
      method: 'get',
      url: longUrl
    }

    let exist = false;
    await axios(option).catch(function (error) {
      if (error) {
        exist = true
      }
    })
    if (exist) {
      return res.status(400).send({ status: false, message: "Opps!!! LongUrl is invalid" })
    }

    //validate uniqueness of longUrl and find it in cahedData
    let cahcedLinkData = await GET_ASYNC(`${longUrl}`)
    cahcedLinkData = JSON.parse(cahcedLinkData)

    if (cahcedLinkData) {
      return res.status(409).send({ status: false, message: "LongUrl already shorted in cahceData....", shortUrl: cahcedLinkData.shortUrl });
    } else {
      let uniqueUrl = await urlModel.findOne({ longUrl });
      await SET_ASYNC(`${longUrl}`, `3600`, JSON.stringify(uniqueUrl))
      if (uniqueUrl) {
        return res.status(409).send({ status: false, message: "LongUrl already shorted", shortUrl: uniqueUrl.shortUrl });
      }
    }

    //generate shortId and add in requestBody
    let urlCode = shortid.generate().toLowerCase();
    requestBody.urlCode = urlCode;

    //create shortUrl and add in requestBody
    let shortUrl = `http://localhost:3000/${urlCode}`;
    requestBody.shortUrl = shortUrl;

    //validate uniqueness of sortId and find it in cahedData
    let cahcedSort = await GET_ASYNC(`${urlCode}`)
    if (cahcedSort) {
      return res.status(409).send({ status: false, message: "shortid already present in cahedData...." });
    } else {
      let uniqueSort = await urlModel.findOne({ urlCode });
      await SET_ASYNC(`${longUrl}`, 3600, JSON.stringify(uniqueSort))
      if (uniqueSort) {
        return res.status(409).send({ status: false, message: "shortid already present in db" });
      }
    }

    //create document amd send response
    let data = await urlModel.create(requestBody);
    const createUrl = ({ urlCode: data.urlCode, longUrl: data.longUrl, shortUrl: data.shortUrl })
    await SET_ASYNC(`${longUrl}`, 3600, JSON.stringify(createUrl))
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
        return res.status(404).send({ status: false, message: "Opps!! ShortUrl not found" });
      }
      await SET_ASYNC(`${urlCode}`, `3600`, JSON.stringify(fullUrl))
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
