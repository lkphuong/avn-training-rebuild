const { app } = require("@azure/functions");
const { MongoClient } = require("mongodb");
const xlsx = require("xlsx");

const {
  decodeJWT,
  success,
  authorization,
  getDateNowFormat,
} = require("../../utils");
const { StatusCodes } = require("http-status-codes");
const { HEADERS, SEND_FILE_HEADER } = require("../../constant/header");
const { ROLE } = require("../../constant/role");
const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0052_export_account", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "accounts/export",
  handler: async (request, context) => {
    try {
      context.log(`Http function processed request for url "${request.url}"`);

      const token = request.headers.get("authorization");
      const decode = await decodeJWT(token);
      if (!decode) {
        return (context.res = {
          status: StatusCodes.UNAUTHORIZED,
          body: success(null, "Vui lòng đăng nhập trước khi gọi request."),
          headers: HEADERS,
        });
      }

      if (!authorization(decode, ROLE.ADMIN)) {
        return (context.res = {
          status: StatusCodes.FORBIDDEN,
          body: success(null, "Không có quyền gọi request."),
          headers: HEADERS,
        });
      }

      await client.connect();
      const database = client.db(DB_NAME);
      const collection = database.collection(COLLECTION.ACCOUNT);
      const userCollection = database.collection(COLLECTION.USERS);

      const accounts = await collection
        .find({ deleted: false })
        .sort({ createdAt: -1 })
        .toArray();

      const userIds = accounts.map((e) => e.userId);

      const users = await userCollection
        .find({ _id: { $in: userIds } })
        .toArray();

      let accountsFormated = accounts.map((account) => {
        const {
          username,
          name,
          birthday,
          email,
          gender,
          phoneNumber,
          active,
          lang,
          createdAt,
          _id,
        } = account;

        const user = users.find(
          (e) => e?._id?.toString() == account?.userId?.toString()
        );
        return {
          _id,
          username,
          name,
          birthday,
          email,
          gender,
          phoneNumber,
          active,
          lang,
          createdAt,
          userId: {
            position: user?.position,
            dateOutOfWork: user?.dateOutOfWork,
            department: user?.department,
            unit: user?.unit,
            section: user?.section,
          },
        };
      });

      const workbook = xlsx.utils.book_new();
      const sheetName = "Sheet 1";

      workbook.Props = {
        Title: `Report Account`,
        Subject: `Report Account`,
        Author: "AWS CMS",
        CreatedDate: new Date(Date.now()),
      };

      workbook.SheetNames.push(sheetName);

      const titleHeader = [
        `Báo cáo danh sách nhân viên ngày ${getDateNowFormat("DD/MM/YYYY")}`,
      ];

      const codeHeader = [
        "STT",
        "USERSKU",
        "DISPLAYNAME",
        "EMAIL",
        "GENDER",
        "USERDEPT",
        "SECTION",
        "UNIT",
        "POSITION",
        "ACTIVE",
        "LANGUAGE",
      ];

      const vietnameseHeader = [
        "Số thứ tự",
        "Mã số NV",
        "Tên User",
        "Email",
        "Giới tính (male/false)",
        "Phòng ban",
        "Bộ phận làm việc",
        "Đơn vị",
        "Vị trí",
        "Tình trạng",
        "Ngôn ngữ",
      ];

      const formatedData = accountsFormated.map((acc, idx) => {
        const { username, name, email, gender, active, lang } = acc;

        const { position, department, unit, section } = acc?.userId;

        return [
          idx + 1,
          username,
          name,
          email,
          gender,
          department,
          section,
          unit,
          position,
          active,
          lang,
        ];
      });

      const rows = [titleHeader, codeHeader, vietnameseHeader, ...formatedData];

      const ws = xlsx.utils.aoa_to_sheet(rows);

      workbook.Sheets[sheetName] = ws;

      const colWidths = vietnameseHeader.map((header) => {
        return { wch: header.length };
      });

      ws["!cols"] = [...colWidths];

      const fileBuffer = xlsx.write(workbook, {
        bookType: "xlsx",
        type: "buffer",
      });

      return (context.res = {
        status: StatusCodes.OK,
        body: fileBuffer,
        headers: SEND_FILE_HEADER,
      });
    } catch (e) {
      console.log("err: ", e);
      return (context.res = {
        status: StatusCodes.BAD_REQUEST,
        body: success(null, "Đã có lỗi xảy ra vui lòng thử lại."),
        headers: HEADERS,
      });
    }
  },
});
