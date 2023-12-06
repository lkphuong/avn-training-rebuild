const HEADERS = {
  "Content-Type": "application/json",
};

const SEND_FILE_HEADER = {
  "Content-Type":
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "Content-Disposition": "attachment; filename=report.xlsx",
};

module.exports = { HEADERS, SEND_FILE_HEADER };
