const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");

const { success } = require("../../utils");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { HEADERS } = require("../../constant/header");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0036_post_categories_get_by_slug", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  route: "post-categories/getBySlug/{slug}",
  handler: async (request, context) => {
    try {
      context.log(`Http function processed request for url "${request.url}"`);

      const slug = request.params.slug;

      await client.connect();
      const database = client.db(DB_NAME);
      const collection = database.collection(COLLECTION.POST_CATEGORIES);
      const fileCollection = database.collection(COLLECTION.FILE);

      const postCategory = await collection.findOne({ slug: slug });

      if (postCategory) {
        const bigBanner = await fileCollection.findOne({
          _id: new ObjectId(postCategory.bigBanner),
        });

        return (context.res = {
          status: StatusCodes.OK,
          body: success({ ...postCategory, bigBanner: bigBanner }, null),
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
