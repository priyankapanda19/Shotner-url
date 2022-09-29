const urlModel = require("../models/urlModel");
const shortid = require("shortid");
const valid = require("../validation/validators");

const createUrl = async (req, res) => {
  try {
    const requestBody = req.body;
    const longUrl = requestBody.longUrl;
    if (Object.keys(requestBody).length == 0) {
      return res
        .status(400)
        .send({ status: false, message: "Please enter some input" });
    }
    if (!valid.isEmpty(longUrl)) {
      return res
        .status(400)
        .send({ status: false, message: "longUrl is mandatory" });
    }
    if (!valid.isValidLink(longUrl)) {
      return res
        .status(400)
        .send({ status: false, message: "longUrl is not in valid format" });
    }

    let uniqueUrl = await urlModel.findOne({ longUrl });
    if (uniqueUrl) {
      return res
        .status(400)
        .send({ status: false, message: "LongUrl already exist" });
    }
    let sort = shortid.generate();
    let uniqueUrlCode = await urlModel.findOne({ urlCode: sort });
    if (uniqueUrlCode) {
      return res
        .status(400)
        .send({ status: false, message: "urlCode already exist" });
    }
    requestBody.urlCode = sort;
    let sortu = `http://localhost:3000/${sort}`;
    requestBody.shortUrl = sortu;
    await urlModel.create(requestBody);
    const createUrl = await urlModel
      .findOne({ shortUrl: sortu })
      .select({ __v: 0 });
    return res.status(201).send({ status: true, data: createUrl });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

const findUrl = async (req, res) => {
  try {
    const requestBody = req.params.urlCode;
    // if (!valid.isValidObjectId(requestBody)) {
    //   return res
    //     .status(400)
    //     .send({ status: false, message: "Not valid objectId" });
    // }
    const findUrl = await urlModel.findOne({urlCode:requestBody});
    if (!findUrl) {
      return res.status(404).send({ status: false, message: "URL not found" });
    }
    return res.status(302).redirect(findUrl.longUrl);
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

module.exports = {
  createUrl,
  findUrl,
};
