const mongoose = require('mongoose')

const isEmpty = (value) => {
  if (typeof value === "undefined" || value === null) return false;
  if (typeof value === "string" && value.trim().length === 0) return false;
  return true;
};

const isValidObjectId = (data) => {
  return mongoose.Types.ObjectId.isValid(data)
}

module.exports = {
  isEmpty, isValidObjectId
}
