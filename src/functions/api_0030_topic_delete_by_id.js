const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");

const { success, decodeJWT, authorization } = require("../../utils");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { HEADERS } = require("../../constant/header");
const { ROLE } = require("../../constant/role");

const client = new MongoClient(CONNECTION_STRING);
app.http("api_0030_topic_delete_by_id", {
  methods: ["DELETE"],
  authLevel: "anonymous",
  route: "topics/delete/deleteById/{id}",
  handler: async (request, context) => {
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

    const id = request.params.id;

    await client.connect();
    const database = client.db(DB_NAME);
    const collection = database.collection(COLLECTION.TOPIC);
    const categoryCollection = database.collection(COLLECTION.POST_CATEGORIES);

    const topic = await collection.findOne({
      _id: new ObjectId(id),
      deleted: false,
    });

    if (!topic) {
      return (context.res = {
        status: StatusCodes.NOT_FOUND,
        body: success(null, "Không tìm thấy chủ đề."),
        headers: HEADERS,
      });
    }

    const existCateogry = await categoryCollection.findOne({
      topicId: new ObjectId(id),
      deleted: false,
    });
    if (existCateogry) {
      return (context.res = {
        status: StatusCodes.BAD_REQUEST,
        body: success(
          null,
          "Đã tồn tại loại chủ đề trong chủ đề này. Hãy xóa loại chủ đề trước"
        ),
        headers: HEADERS,
      });
    }

    await collection.findOneAndUpdate(
      { _id: new ObjectId(id), deleted: false },
      { $set: { deleted: true, slug: topic.slug + "-" + Date.now() } }
    );

    return (context.res = {
      status: StatusCodes.OK,
      body: success({ _id: id }, null),
      headers: HEADERS,
    });
  },
});
