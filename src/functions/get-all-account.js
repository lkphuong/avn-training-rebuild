const { app } = require("@azure/functions");
const { MongoClient } = require("mongodb");
const { StatusCodes } = require("http-status-codes");
const { success } = require("../../utils");
const { ERROR_MESSAGE } = require("../../constant/error_message");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config/db");

const client = new MongoClient(CONNECTION_STRING);

app.http("get-all-account", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  route: "accounts",
  handler: async (request, context) => {
    context.log(`Http function processed request for url`);

    await client.connect();
    const database = client.db(DB_NAME);
    const collection = database.collection(COLLECTION.ACCOUNT);
    const data = await collection.find({}).toArray();

    if (data?.length) {
      return (context.res = {
        status: StatusCodes.OK,
        body: success(data, null),
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
    return (context.res = {
      status: StatusCodes.OK,
      body: success(data, ERROR_MESSAGE.NO_CONTENT),
      headers: {
        "Content-Type": "application/json",
      },
    });
  },
});
