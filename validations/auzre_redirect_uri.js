const validateRedirectUri = (data) => {
  const errors = [];

  if (!data.redirectUri || typeof data.redirectUri !== "string") {
    errors.push("redirectUri không được để trống và phải là chuỗi");
  }

  return errors;
};

module.exports = { validateRedirectUri };
