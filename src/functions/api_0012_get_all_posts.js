const { app } = require("@azure/functions");
const { MongoClient } = require("mongodb");
const { StatusCodes } = require("http-status-codes");
const { success } = require("../../utils");
const { ERROR_MESSAGE } = require("../../constant/error_message");
const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { HEADERS } = require("../../constant/header");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0012_get_all_posts", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "posts",
  handler: async (request, context) => {
    context.log(`Http function processed request for url "${request.url}"`);

    await client.connect();
    const database = client.db(DB_NAME);
    const collection = database.collection(COLLECTION.POST);
    const data = await collection.find({ deleted: false }).toArray();
    if (data?.length) {
      return (context.res = {
        status: StatusCodes.OK,
        body: success(data, null),
        headers: HEADERS,
      });
    }
    return (context.res = {
      status: StatusCodes.NOT_FOUND,
      body: success(data, ERROR_MESSAGE.NO_CONTENT),
      headers: HEADERS,
    });
  },
});
