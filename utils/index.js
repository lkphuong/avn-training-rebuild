const dayjs = require("dayjs");

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

module.exports = { success, getDateNowFormat, getDateNow };
