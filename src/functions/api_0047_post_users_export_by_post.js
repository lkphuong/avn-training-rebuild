const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");
const xlsx = require("xlsx");
const fs = require("fs");

const { success } = require("../../utils");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { HEADERS, SEND_FILE_HEADER } = require("../../constant/header");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0047_post_users_export_by_post", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "post-users/exportByPostId/{postId}",
  handler: async (request, context) => {
    context.log(`Http function processed request for url "${request.url}"`);

    const postId = request.params.postId;
    const query = request.query;

    await client.connect();
    const database = client.db(DB_NAME);
    const collection = database.collection(COLLECTION.EXAM);
    const postCollection = database.collection(COLLECTION.POST);
    const accountCollection = database.collection(COLLECTION.ACCOUNT);

    const post = await postCollection.findOne({ _id: new ObjectId(postId) });

    if (!post) {
      return (context.res = {
        status: StatusCodes.NOT_FOUND,
        body: success(null, "Bài post không tồn tại."),
        headers: HEADERS,
      });
    }

    let userViewed = await findUserViewedByPost(
      postId,
      query,
      collection,
      accountCollection
    );

    const workbook = xlsx.utils.book_new();

    const sheetName = "Sheet 1";

    workbook.Props = {
      Title: `Report User Viewed of Post ${postId}`,
      Subject: `Report User Viewed of Post ${postId}`,
      Author: "AWS CMS",
      CreatedDate: new Date(Date.now()),
    };

    workbook.SheetNames.push(sheetName);

    const titleHeader = [
      `Báo cáo số lượt xem của bài viết ${post.title} ngày ${getDateNowFormat(
        "DD/MM/YYYY"
      )}`,
    ];

    const codeHeader = [
      "STT",
      "USERSKU",
      "DISPLAYNAME",
      "USERDEPT",
      "BIRTHDAY",
      "GENDER",
      "PHONE",
      "EMAIL",
      "DATEOUTWORK",
      "SECTION",
      "UNIT",
      "POSITION",
      "VIEW STATUS",
      "VIEW AT",
      "DONE AT",
    ];

    const vietnameseHeader = [
      "Số thứ tự",
      "Mã số NV",
      "Tên User",
      "Phòng ban",
      "Ngày sinh (dd/mm/yyyy)",
      "Giới tính (male/false)",
      "SĐT",
      "Email",
      "Ngày nghỉ việc (dd/mm/yyyy)",
      "Bộ phận làm việc",
      "Đơn vị",
      "Vị trí",
      "Tình trạng xem",
      "Ngày bắt đầu xem",
      "Ngày xem hết",
    ];

    const formatedData = userViewed.data.map((userViewed, index) => {
      const { username, name, birthday, gender, phoneNumber, email } =
        userViewed.account;
      const { department, dateOutOfWork, section, unit, position } =
        userViewed.account.userId;

      return [
        index + 1,
        username,
        name,
        department,
        birthday,
        gender ? "Nam" : "Nữ",
        phoneNumber,
        email,
        dateOutOfWork,
        section,
        unit,
        position,
        userViewed?.done ? "Đã xem hết" : "Chưa xem hết",
        userViewed?.createdAt
          ? moment(userViewed?.createdAt).format("DD/MM/YYYY HH:mm")
          : "",
        userViewed?.doneAt
          ? moment(userViewed?.doneAt).format("DD/MM/YYYY HH:mm")
          : "",
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
      body: fs.createReadStream(fileBuffer),
      headers: SEND_FILE_HEADER,
    });
  },
});
