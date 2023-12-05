const { app } = require("@azure/functions");
const { MongoClient } = require("mongodb");
const { StatusCodes } = require("http-status-codes");

const { success, decodeJWT } = require("../../utils");
const { ERROR_MESSAGE } = require("../../constant/error_message");
const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { HEADERS } = require("../../constant/header");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0022_topic_get_all", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "topics",
  handler: async (request, context) => {
    try {
      context.log(`Http function processed request for url "${request.url}"`);

      const token = request.headers.get("authorization");
      const decode = await decodeJWT(token);
      if (!decode) {
        return (context.res = {
          status: StatusCodes.BAD_REQUEST,
          body: success(null, "Vui lòng đăng nhập trước khi gọi request."),
          headers: HEADERS,
        });
      }

      await client.connect();
      const database = client.db(DB_NAME);
      const collection = database.collection(COLLECTION.TOPIC);
      const fileCollection = database.collection(COLLECTION.FILE);

      const topics = await collection.find().toArray();
      if (topics?.length > 0) {
        const fileIds = topics.map((e) => e.banner);
        const files = await fileCollection
          .find({
            _id: { $in: fileIds },
            deleted: false,
          })
          .toArray();
        const results = topics.map((topic) => {
          const banner = files.find((file) => file._id == topic.banner);

          return {
            ...topic,
            banner: banner ?? null,
          };
        });
        return (context.res = {
          status: StatusCodes.OK,
          body: success({ results }, null),
          headers: HEADERS,
        });
      }
      return (context.res = {
        status: StatusCodes.NOT_FOUND,
        body: success(null, "Không dữ liệu hiển thị."),
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
