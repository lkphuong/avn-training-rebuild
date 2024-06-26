const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");

const { success, decodeJWT, authorization } = require("../../utils");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { HEADERS } = require("../../constant/header");
const { ROLE } = require("../../constant/role");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0040_post_categories_delete_by_id", {
  methods: ["DELETE"],
  authLevel: "anonymous",
  route: "post-categories/delete/deleteById/{id}",
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

      const id = request.params.id;

      await client.connect();
      const database = client.db(DB_NAME);
      const collection = database.collection(COLLECTION.POST_CATEGORIES);
      const postCollection = database.collection(COLLECTION.POST);

      const postCategory = await collection.findOne({
        _id: new ObjectId(id),
        deleted: false,
      });
      if (!postCategory) {
        return (context.res = {
          status: StatusCodes.NOT_FOUND,
          body: success(null, "Loại chủ đề không tồn tại"),
          headers: HEADERS,
        });
      }

      const post = await postCollection.findOne({
        categoryId: new ObjectId(id),
        deleted: false,
      });
      if (post) {
        return (context.res = {
          status: StatusCodes.BAD_REQUEST,
          body: success(
            null,
            "Loại chủ đề này đã có bài viết. Hãy xóa bài viết trước"
          ),
          headers: HEADERS,
        });
      }

      await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        {
          $set: {
            deleted: true,
          },
        }
      );

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
