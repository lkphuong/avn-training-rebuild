const dayjs = require("dayjs");
const { CryptoProvider } = require("@azure/msal-node");

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

const decode = (state) => {
  let str = provider.base64Decode(state);
  try {
    return JSON.parse(str);
  } catch (e) {
    str = str.substring(0, str.length - 1);
    return JSON.parse(str);
  }
};

module.exports = { success, getDateNowFormat, getDateNow, decode };
