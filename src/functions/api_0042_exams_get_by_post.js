const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");

const { success } = require("../../utils");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { HEADERS } = require("../../constant/header");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0042_exams_get_by_post", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "exams/getByPostId/{postId}",
  handler: async (request, context) => {
    try {
      context.log(`Http function processed request for url "${request.url}"`);

      const postId = request.params.postId;

      await client.connect();
      const database = client.db(DB_NAME);
      const collection = database.collection(COLLECTION.EXAM);
      const postCollection = database.collection(COLLECTION.POST);

      const post = await postCollection.findOne({ _id: new ObjectId(postId) });

      if (post) {
        const testDetail = await collection.findOne({
          sourceId: new ObjectId(post._id),
        });

        const total = await postCollection.countDocuments({
          categoryId: new ObjectId(post.categoryId),
          deleted: false,
        });

        return (context.res = {
          status: StatusCodes.OK,
          body: success(
            {
              ...testDetail,
              totalPost: total,
            },
            null
          ),
          headers: HEADERS,
        });
      }

      return (context.res = {
        status: StatusCodes.NOT_FOUND,
        body: success(null, "Không có dữ liệu hiển thị."),
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
