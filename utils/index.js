const dayjs = require("dayjs");
const { CryptoProvider } = require("@azure/msal-node");
const { JWT_KEY } = require("../config");

const provider = new CryptoProvider();

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

const decodeJWT = async (token) => {
  try {
    const decode = await jwt.verify(token, JWT_KEY);

    return {
      username: decode.username,
      role: decode?.role ?? "user",
      lang: decode?.lang ?? ["vi"],
    };
  } catch (e) {
    return null;
  }
};

const getLanguage = (role) => {
  if (role == "user") return ["vi"];

  return ["vi", "en"];
};

module.exports = { success, getDateNowFormat, getDateNow, decodeJWT };
