const dayjs = require("dayjs");
const { CryptoProvider } = require("@azure/msal-node");
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
      username: decode.username,
      role: decode?.role ?? "user",
      lang: decode?.lang ?? ["vi"],
    };
  } catch (e) {
    console.log("decode err: ", e);
    return null;
  }
};

const getLanguage = (role) => {
  if (role == "user") return ["vi"];

  return ["vi", "en"];
};

module.exports = { success, getDateNowFormat, getDateNow, decodeJWT };
