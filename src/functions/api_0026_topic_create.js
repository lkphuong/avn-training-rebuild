const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");

const { success, _slugify, decodeJWT, authorization } = require("../../utils");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { HEADERS } = require("../../constant/header");
const { validateCreateTopic } = require("../../validations/create_topic");
const { ROLE } = require("../../constant/role");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0026_topic_create", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "topics/create",
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

    // const validationErrors = validateCreateTopic(data);
    // if (validationErrors.length > 0) {
    //   return (context.res = {
    //     status: StatusCodes.BAD_REQUEST,
    //     body: success(null, null, validationErrors),
    //     headers: HEADERS,
    //   });
    // }

    await client.connect();
    const database = client.db(DB_NAME);
    const collection = database.collection(COLLECTION.TOPIC);

    const _id = new ObjectId();

    await collection.insertOne({
      _id,
      deleted: false,
      slug: _slugify(data.name) + "-" + Date.now(),
      ...data,
    });

    return (context.res = {
      status: StatusCodes.OK,
      body: success({ _id }, null),
      headers: HEADERS,
    });
  },
});
