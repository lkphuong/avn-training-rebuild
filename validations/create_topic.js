const validateCreateTopic = (data) => {
  const errors = [];

  if (!data.banner) {
    errors.push("Banner không được để trống");
  }

  if (!data.name || typeof data.name !== "string") {
    errors.push("Tên phải là chuỗi");
  }

  if (!data.description || typeof data.description !== "string") {
    errors.push("Mô tả phải là chuỗi");
  }

  if (!data.seoUrl || typeof data.seoUrl !== "string") {
    errors.push("Link seo phải là chuỗi");
  }

  if (!data.sortOrder || typeof data.sortOrder !== "number") {
    errors.push("Sort order phải là số.");
  }

  if (typeof data.isPin !== "boolean") {
    errors.push("Is pin phải là boolean.");
  }

  if (typeof data.active !== "boolean") {
    errors.push("Active phải là boolean.");
  }

  return errors;
};

module.exports = { validateCreateTopic };
