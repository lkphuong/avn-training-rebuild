const validateCreateAccount = (data) => {
  const errors = [];
  if (!data.username || typeof data.username !== "string") {
    errors.push("Tên đăng nhập không được để trống");
  }

  if (!data.password || typeof data.password !== "string") {
    errors.push("Mật khẩu không được để trống");
  } else if (data.password.length < 6) {
    errors.push("Mật khẩu phải có ít nhất 6 kí tự");
  }

  if (!data.name || typeof data.name !== "string") {
    errors.push("Tên không được để trống");
  }

  if (!(new Date(data.birthday) instanceof Date)) {
    errors.push("Ngày sinh phải là ngày");
  }

  if (typeof data.gender !== "boolean") {
    errors.push("Giới tính phải là boolean");
  }

  if (
    !data.email ||
    typeof data.email !== "string" ||
    !/\S+@\S+\.\S+/.test(data.email)
  ) {
    errors.push("Email không đúng định dạng");
  }

  if (
    data.phoneNumber &&
    (typeof data.phoneNumber !== "string" || data.phoneNumber.length > 15)
  ) {
    errors.push("Số điện thoại tối đa 15 kí tự");
  }

  // if (data.isAdmin && typeof data.isAdmin !== "boolean") {
  //   errors.push("Loại tài khoản phải là boolean");
  // }

  if (data.dateOutOfWork && !(data.dateOutOfWork instanceof Date)) {
    errors.push("Ngày nghỉ phải là ngày");
  }

  if (data.department && typeof data.department !== "string") {
    errors.push("Phòng ban phải là chuỗi");
  }

  if (data.unit && typeof data.unit !== "string") {
    errors.push("Đơn vị phải là chuỗi");
  }

  if (data.section && typeof data.section !== "string") {
    errors.push("Bộ phận phải là chuỗi");
  }

  if (data.position && typeof data.position !== "string") {
    errors.push("Vị trí phải là chuỗi");
  }

  if (data.lang && typeof data.lang !== "string") {
    errors.push("Ngôn ngữ phải là chuỗi");
  }

  return errors;
};

module.exports = { validateCreateAccount };
