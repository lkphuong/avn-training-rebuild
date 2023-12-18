const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");

const { success, decodeJWT } = require("../../utils");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { HEADERS } = require("../../constant/header");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0021_delete_post", {
  methods: ["DELETE"],
  authLevel: "anonymous",
  route: "posts/delete/deleteById/{id}",
  handler: async (request, context) => {
    try {
      context.log(`Http function processed request for url "${request.url}"`);

      const id = request.params.id;

      const token = request.headers.get("authorization");
      const decode = await decodeJWT(token);
      if (!decode) {
        return (context.res = {
          status: StatusCodes.UNAUTHORIZED,
          body: success(null, "Vui lòng đăng nhập trước khi gọi request."),
          headers: HEADERS,
        });
      }

      await client.connect();
      const database = client.db(DB_NAME);
      const collection = database.collection(COLLECTION.POST);

      let post = await collection.findOne({
        _id: new ObjectId(id),
        deleted: false,
      });

      if (!post) {
        return (context.res = {
          status: StatusCodes.NOT_FOUND,
          body: success(null, "Bài viết không tồn tại."),
          headers: {
            "Content-Type": "application/json",
          },
        });
      }

      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id), deleted: false },
        {
          $set: {
            deleted: true,
            slug: post.slug + "-" + Date.now(),
          },
        }
      );

      console.log("result: ", result);

      return (context.res = {
        status: StatusCodes.OK,
        body: success({ _id: id }, null),
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
