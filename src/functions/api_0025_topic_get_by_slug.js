const { app } = require("@azure/functions");
const { MongoClient } = require("mongodb");
const { StatusCodes } = require("http-status-codes");

const { success, decodeJWT } = require("../../utils");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { ERROR_MESSAGE } = require("../../constant/error_message");
const { HEADERS } = require("../../constant/header");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0025_topic_get_by_slug", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "topics/getBySlug/{slug}",
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

    const slug = request.params.slug;

    await client.connect();
    const database = client.db(DB_NAME);
    const collection = database.collection(COLLECTION.TOPIC);

    const topic = await collection.findOne({ slug: slug, deleted: false });

    if (topic) {
      return (context.res = {
        status: StatusCodes.OK,
        body: success(topic, ERROR_MESSAGE.NOT_FOUND),
        headers: HEADERS,
      });
    }

    return (context.res = {
      status: StatusCodes.NOT_FOUND,
      body: success(null, ERROR_MESSAGE.NOT_FOUND),
      headers: HEADERS,
    });
  },
});
