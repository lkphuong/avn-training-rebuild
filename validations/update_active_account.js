const validateUpdateActiveAccount = (data) => {
  const errors = [];

  if (typeof data.status !== "boolean") {
    errors.push("Tình trạng phải là boolean");
  }

  return errors;
};

module.exports = { validateUpdateActiveAccount };
