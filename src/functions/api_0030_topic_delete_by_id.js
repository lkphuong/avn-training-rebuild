const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");

const { success } = require("../../utils");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { ERROR_MESSAGE } = require("../../constant/error_message");
const { HEADERS } = require("../../constant/header");
const { validateCreateTopic } = require("../../validations/create_topic");

const client = new MongoClient(CONNECTION_STRING);
app.http("api_0030_topic_delete_by_id", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    context.log(`Http function processed request for url "${request.url}"`);

    const id = request.params.id;

    await client.connect();
    const database = client.db(DB_NAME);
    const collection = database.collection(COLLECTION.TOPIC);
    const categoryCollection = database.collection(COLLECTION.POST_CATEGORIES);

    const topic = await collection.findOne({
      _id: new ObjectId(id),
      deleted: false,
    });

    if (!topic) {
      return (context.res = {
        status: StatusCodes.NOT_FOUND,
        body: success(null, "Không tìm thấy chủ đề."),
        headers: HEADERS,
      });
    }

    const existCateogry = await categoryCollection.findOne({
      topicId: new ObjectId(id),
      deleted: false,
    });
    if (existCateogry) {
      return (context.res = {
        status: StatusCodes.BAD_REQUEST,
        body: success(
          null,
          "Đã tồn tại loại chủ đề trong chủ đề này. Hãy xóa loại chủ đề trước"
        ),
        headers: HEADERS,
      });
    }

    await collection.findOneAndUpdate(
      { _id: new ObjectId(id), deleted: false },
      { $set: { deleted: true, slug: topic.slug + "-" + Date.now() } }
    );

    return (context.res = {
      status: StatusCodes.OK,
      body: success({ _id }, null),
      headers: HEADERS,
    });
  },
});
