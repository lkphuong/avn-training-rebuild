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

app.http("api_0017_create_post", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "posts/create",
  handler: async (request, context) => {
    context.log(`Http function processed request for url "${request.url}"`);

    const data = await request.json();

    const validationErrors = validateCreatePost(data);

    if (validationErrors.length > 0) {
      return (context.res = {
        status: StatusCodes.BAD_REQUEST,
        body: success(null, null, validationErrors),
        headers: HEADERS,
      });
    }

    let sourceId, sourceType;
    let existExam = false;

    await client.connect();
    const database = client.db(DB_NAME);
    const collection = database.collection(COLLECTION.POST);
    const examCollection = database.collection(COLLECTION.EXAM);

    const _id = new ObjectId();

    if (data.testType === SOURCE_LINK.POST_CATEGORY) {
      sourceId = data.categoryId;
      sourceType = SOURCE_LINK.POST_CATEGORY;

      const exam = await examCollection.findOne({
        sourceId: new ObjectId(data.categoryId),
      });

      if (exam) {
        existExam = true;
      } else {
        sourceId = _id;
        sourceType = SOURCE_LINK.POST;
      }

      if (!existExam) {
        await examCollection.insertOne({
          _id,
          url: data.linkTest,
          sourceId,
          sourceType,
        });
      }

      await collection.insertOne({
        _id,
        ...data,
      });

      return (context.res = {
        status: StatusCodes.OK,
        body: success({ _id }, null),
        headers: HEADERS,
      });
    }
  },
});
