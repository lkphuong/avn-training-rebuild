const { app } = require("@azure/functions");
const { MongoClient } = require("mongodb");
const { StatusCodes } = require("http-status-codes");
const { success, decodeJWT } = require("../../utils");
const { CONNECTION_STRING, COLLECTION, DB_NAME } = require("../../config");
const { HEADERS } = require("../../constant/header");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0020_update_by_id", {
  methods: ["PUT"],
  authLevel: "anonymous",
  route: "posts/update/updateById/{id}",
  handler: async (request, context) => {
    try {
      context.log(`Http function processed request for url "${request.url}"`);

      const data = await request.json();
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

      const validationErrors = validateCreatePost(data);

      if (validationErrors.length > 0) {
        return (context.res = {
          status: StatusCodes.BAD_REQUEST,
          body: success(null, null, validationErrors),
          headers: HEADERS,
        });
      }

      await client.connect();
      const database = client.db(DB_NAME);
      const collection = database.collection(COLLECTION.POST);
      const examCollection = database.collection(COLLECTION.EXAM);

      const post = await collection.findOne({ _id: new ObjectId(id) });
      if (!post) {
        return (context.res = {
          status: StatusCodes.NOT_FOUND,
          body: success(null, "Không tìm thấy bài viết"),
          headers: HEADERS,
        });
      }

      if (post.title !== data.title) {
        const slug =
          slugify(data.title, { locale: "vi", lower: true }) + "-" + Date.now();

        const existPost = await collection.findOne({ slug });
        if (existPost) {
          return (context.res = {
            status: StatusCodes.NOT_FOUND,
            body: success(null, "Duplicated field"),
            headers: HEADERS,
          });
        }
      }

      let examResult = await examCollection.findOne({
        sourceId: new ObjectId(post._id),
        sourceType: SOURCE_LINK.POST,
      });

      if (!examResult) {
        examResult = await examCollection.findOne({
          sourceId: post.categoryId,
          sourceType: SOURCE_LINK.POST_CATEGORY,
        });
      }

      if (examResult) {
        await examCollection.findOneAndUpdate(
          {
            sourceId: examResult?.sourceId,
            sourceType: examResult?.sourceType,
          },
          {
            $set: {
              url: data.linkTest,
              sourceType: data.testType,
              sourceId:
                data.testType === SOURCE_LINK.POST ? post._id : post.categoryId,
            },
          }
        );
      }

      await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        {
          $set: {
            ...data,
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
