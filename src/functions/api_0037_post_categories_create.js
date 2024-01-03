const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");

const { success, _slugify, decodeJWT, authorization } = require("../../utils");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { HEADERS } = require("../../constant/header");
const { ROLE } = require("../../constant/role");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0037_post_categories_create", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "post-categories/create",
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

      const data = await request.json();

      await client.connect();
      const database = client.db(DB_NAME);
      const collection = database.collection(COLLECTION.POST_CATEGORIES);

      //validate next
      const _id = new ObjectId();
      const slug = _slugify(data.name) + "-" + Date.now();

      await collection.insertOne({
        _id,
        slug,
        deleted: false,
        createdAt: new Date(),
        ...data,
        banner: new ObjectId(data.banner),
        bigBanner: new ObjectId(data.bigBanner),
        topicId: new ObjectId(data.topicId),
      });
      return (context.res = {
        status: StatusCodes.OK,
        body: success({ _id }, null),
        headers: HEADERS,
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
