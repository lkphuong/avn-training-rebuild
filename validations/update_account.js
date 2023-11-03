function validateUpdateAccount(data) {
  const errors = [];

  if (data.name && typeof data.name !== "string") {
    errors.push("Tên phải là chuỗi");
  }

  if (data.birthday && !(new Date(data.birthday) instanceof Date)) {
    errors.push("Ngày sinh phải là ngày");
  }

  if (data.gender && typeof data.gender !== "boolean") {
    errors.push("Giới tính phải là boolean");
  }

  if (data.email && typeof data.email !== "string") {
    errors.push("Email phải là chuỗi");
  }

  if (
    data.phoneNumber &&
    (typeof data.phoneNumber !== "string" || data.phoneNumber.length > 15)
  ) {
    errors.push("Số điện thoại tối đa 15 kí tự");
  }

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
}

module.exports = { validateUpdateAccount };
