exports.success = (data, message = "Success") => {
  return JSON.stringify({
    data: data,
    errorCode: 0,
    message: message,
    errors: [],
  });
};
