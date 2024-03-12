const dayjs = require("dayjs");
const { JWT_KEY } = require("../config");
const jwt = require("jsonwebtoken");

const success = (data, message = "Success", errors = []) => {
  return JSON.stringify({
    data: data,
    errorCode: 0,
    message: message,
    errors: errors,
  });
};

const getDateNowFormat = (format) => {
  if (!format) {
    format = "DD-MM-YYYY";
  }

  return dayjs().format(format);
};

const getDateNow = () => new Date(Date.now());

const decodeJWT = async (data) => {
  try {
    if (!data) return null;
    const token = data.split(" ");
    const decode = await jwt.verify(token[1], JWT_KEY);
    console.log("decode: ", decode);
    return {
      _id: decode._id,
      username: decode.username,
      name: decode.name,
      avatar: decode.avatar,
      user_id: decode.userId,
      group: decode?.group ?? "user",
      lang: decode?.lang ?? ["vi"],
    };
  } catch (e) {
    console.log("decode err: ", e);
    return null;
  }
};

const authorization = (data, role) => {
  if (data.group == role) return true;
  return false;
};

const removeDiacritics = (str) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

const _slugify = (input) => {
  let result = removeDiacritics(input.trim());

  // Replace spaces with hyphens
  result = result.replace(/\s+/g, "-");

  // Remove non-alphanumeric characters
  result = result.replace(/[^a-zA-Z0-9-]/g, "");

  return result.toLowerCase();
};

module.exports = {
  success,
  getDateNowFormat,
  getDateNow,
  decodeJWT,
  authorization,
  _slugify,
};
