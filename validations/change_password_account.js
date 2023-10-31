const validateChangePassword = (data) => {
  const errors = [];

  if (!data.username || typeof data.username !== "string") {
    errors.push("Username không được để trống và phải là chuỗi");
  }

  if (!data.oldPassword || typeof data.oldPassword !== "string") {
    errors.push("Mật khẩu cũ không được để trống và phải là chuỗi");
  }

  if (!data.newPassword || typeof data.newPassword !== "string") {
    errors.push("Mật khẩu mới không được để trống và phải là chuỗi");
  }

  return errors;
};

module.exports = { validateChangePassword };
