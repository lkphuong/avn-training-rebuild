const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");

const { success, _slugify, decodeJWT, authorization } = require("../../utils");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { HEADERS } = require("../../constant/header");
const { ROLE } = require("../../constant/role");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0038_post_categories_update_by_id", {
  methods: ["PUT"],
  authLevel: "anonymous",
  route: "post-categories/update/updateById/{id}",
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
      const data = await request.json();

      await client.connect();
      const database = client.db(DB_NAME);
      const collection = database.collection(COLLECTION.POST_CATEGORIES);

      const category = await collection.findOne({ _id: new ObjectId(id) });

      if (!category) {
        return (context.res = {
          status: StatusCodes.BAD_REQUEST,
          body: success(null, "Không tìm thấy chủ đề."),
          headers: HEADERS,
        });
      }

      if (data._id) {
        delete data._id;
        delete data.createdAt;
      }
      await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        {
          $set: {
            bigBanner: data.bigBanner === "remove" ? null : data.bigBanner,
            slug:
              _slugify(data.name, {
                locale: "vi",
                lower: true,
              }) +
              "-" +
              Date.now(),
            ...data,
            banner: new ObjectId(data.banner),
            bigBanner: new ObjectId(data.bigBanner),
            topicId: new ObjectId(data.topicId),
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
