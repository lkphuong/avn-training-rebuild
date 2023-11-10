const { POST_TYPE } = require("../constant/post_type");
const { SOURCE_LINK } = require("../constant/exam_type");
const { ObjectId } = require("mongodb");

const validateCreatePost = (data) => {
  const errors = [];

  if (!data.title || typeof data.title !== "string") {
    errors.push("Tiêu đề không được bỏ trống và phải là chuỗi");
  }

  if (!data.banner || !(data.banner instanceof ObjectId)) {
    errors.push("Banner không được để trống và phải là object id");
  }

  if (!data.categoryId || !(data.categoryId instanceof ObjectId)) {
    errors.push("ID loại chủ đề không được để trống và phải là object id");
  }

  if (!data.description || typeof data.description !== "string") {
    errors.push("Mô tả phải là chuỗi");
  }

  if (data.content && typeof data.content !== "string") {
    errors.push("Nội dung phải là chuỗi");
  }

  if (data.youtubeId && typeof data.youtubeId !== "string") {
    errors.push("Youtube id phải là chuỗi");
  }

  if (!data.type || !Object.values(POST_TYPE).includes(data.type)) {
    errors.push(
      "Loại post không được để trống và phải là hình ảnh và chữ hoặc video"
    );
  }

  if (!data.duration || typeof data.duration !== "number") {
    errors.push("Thời gian xem bài post không được để trống và phải là số");
  }

  if (data.sortOrder && typeof data.sortOrder !== "number") {
    errors.push("Thứ tự bài post phải là số");
  }

  if (data.seoUrl && typeof data.seoUrl !== "string") {
    errors.push("Link seo phải là chuỗi");
  }

  if (!("active" in data) || typeof data.active !== "boolean") {
    errors.push("Tình trạng hiển thị phải là boolean");
  }

  if (!data.linkTest || typeof data.linkTest !== "string") {
    errors.push("Link test không được để trống và phải là chuỗi");
  }

  if (!data.testType || !Object.values(SOURCE_LINK).includes(data.testType)) {
    errors.push("Link test không được để trống và phải là chuỗi");
  }

  if (data.lang && typeof data.lang !== "string") {
    errors.push("Ngôn ngữ phải là chuỗi");
  }

  return errors;
};

module.exports = { validateCreatePost };
