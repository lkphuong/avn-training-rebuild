const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");
const { success } = require("../../utils");

const { ERROR_MESSAGE } = require("../../constant/error_message");

const { SORT_BY } = require("../../constant/sort_by");
const { SORT_TYPE } = require("../../constant/sort_type");
const { validateCreatePost } = require("../../validations/create_post");
const { DEFAULT_MAX_ITEM_PER_PAGE } = require("../../constant/setting");
const { CONNECTION_STRING, COLLECTION, DB_NAME } = require("../../config");
const { HEADERS } = require("../../constant/header");
const { SOURCE_LINK } = require("../../constant/exam_type");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0019_update_active_post", {
  methods: ["PUT"],
  authLevel: "anonymous",
  route: "posts/update/updateActiveById/{id}",
  handler: async (request, context) => {
    try {
      context.log(`Http function processed request for url "${request.url}"`);

      const data = await request.json();
      const id = request.params.id;

      await client.connect();
      const database = client.db(DB_NAME);
      const collection = database.collection(COLLECTION.POST);

      await collection.updateOne(
        {
          _id: new ObjectId(id),
        },
        {
          $set: {
            active: data.status,
          },
        }
      );

      return (context.res = {
        status: StatusCodes.OK,
        body: success({ _id: id }, null, null),
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
