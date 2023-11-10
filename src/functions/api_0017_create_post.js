const { app } = require("@azure/functions");
const { MongoClient } = require("mongodb");
const { StatusCodes } = require("http-status-codes");
const { success } = require("../../utils");

const { ERROR_MESSAGE } = require("../../constant/error_message");

const { SORT_BY } = require("../../constant/sort_by");
const { SORT_TYPE } = require("../../constant/sort_type");
const { DEFAULT_MAX_ITEM_PER_PAGE } = require("../../constant/setting");
const { CONNECTION_STRING, COLLECTION, DB_NAME } = require("../../config");
const { HEADERS } = require("../../constant/header");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0017_create_post", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "posts/create",
  handler: async (request, context) => {
    context.log(`Http function processed request for url "${request.url}"`);

    const data = await request.json();

    const validationErrors = validateCreateAccount(data);

    if (validationErrors.length > 0) {
      return (context.res = {
        status: StatusCodes.BAD_REQUEST,
        body: success(null, null, validationErrors),
        headers: HEADERS,
      });
    }

    let sourceId, sourceType, boolean;

    await client.connect();
    const database = client.db(DB_NAME);
    const collection = database.collection(COLLECTION.POST);

    const _id = new ObjectId();
  },
});
