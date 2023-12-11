const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");

const { success, _slugify } = require("../../utils");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { HEADERS } = require("../../constant/header");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0038_post_categories_update_by_id", {
  methods: ["PUT"],
  authLevel: "anonymous",
  route: "post-categories/update/updateById/{id}",
  handler: async (request, context) => {
    try {
      context.log(`Http function processed request for url "${request.url}"`);

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
