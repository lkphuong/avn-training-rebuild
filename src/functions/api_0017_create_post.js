const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");

const { success, _slugify, decodeJWT, authorization } = require("../../utils");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { ERROR_MESSAGE } = require("../../constant/error_message");
const { HEADERS } = require("../../constant/header");
const { POST_TYPE } = require("../../constant/post_type");
const { ROLE } = require("../../constant/role");
const { validateCreatePost } = require("../../validations/create_post");
const { SOURCE_LINK } = require("../../constant/exam_type");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0017_create_post", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "posts/create",
  handler: async (request, context) => {
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

    const data = await request.json();

    // const validationErrors = validateCreatePost(data);

    // if (validationErrors.length > 0) {
    //   return (context.res = {
    //     status: StatusCodes.BAD_REQUEST,
    //     body: success(null, null, validationErrors),
    //     headers: HEADERS,
    //   });
    // }

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
      }
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
        deleted: false,
        createdAt: new Date(),
      });
    }

    await collection.insertOne({
      _id,
      slug: _slugify(data.title) + "-" + Date.now(),
      deleted: false,
      ...data,
      active: data?.active || true,
      banner: new ObjectId(data?.banner) ?? null,
      categoryId: new ObjectId(data?.categoryId) ?? null,
      topicId: new ObjectId(data?.topicId) ?? null,
      createdAt: new Date(),
    });

    return (context.res = {
      status: StatusCodes.OK,
      body: success({ _id }, null),
      headers: HEADERS,
    });
  },
});
