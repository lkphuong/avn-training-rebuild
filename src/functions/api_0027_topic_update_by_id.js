const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");

const { success, _slugify, decodeJWT, authorization } = require("../../utils");
const { validateCreateTopic } = require("../../validations/create_topic");

const { CONNECTION_STRING, COLLECTION, DB_NAME } = require("../../config");
const { HEADERS } = require("../../constant/header");
const { ROLE } = require("../../constant/role");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0027_topic_update_by_id", {
  methods: ["PUT"],
  authLevel: "anonymous",
  route: "topics/update/updateById/{id}",
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
    const id = request.params.id;

    const validationErrors = validateCreateTopic(data);

    if (validationErrors.length > 0) {
      console.log("validationErrors.length: ", 1234);
      return (context.res = {
        status: StatusCodes.BAD_REQUEST,
        body: success(null, null, validationErrors),
        headers: HEADERS,
      });
    }
    console.log("validationErrors.length: ", validationErrors.length);
    await client.connect();
    const database = client.db(DB_NAME);
    const collection = database.collection(COLLECTION.TOPIC);
    const fileCollection = database.collection(COLLECTION.FILE);

    const topic = await collection.findOne({ _id: new ObjectId(id) });

    if (!topic) {
      return (context.res = {
        status: StatusCodes.NOT_FOUND,
        body: success(null, "Không tìm thấy chủ đề"),
        headers: HEADERS,
      });
    }

    if (topic.name == data.name) {
      const slug = _slugify(data.name) + "-" + Date.now();
      const existTopic = await collection.findOne({ slug: slug });

      if (existTopic) {
        return (context.res = {
          status: StatusCodes.NOT_FOUND,
          body: success(null, "Duplicated field"),
          headers: HEADERS,
        });
      }

      data.slug = slug;
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...data,
        },
      }
    );

    console.log("result: ", result);

    return (context.res = {
      status: StatusCodes.OK,
      body: success({ _id: id }, null),
      headers: HEADERS,
    });
  },
});
