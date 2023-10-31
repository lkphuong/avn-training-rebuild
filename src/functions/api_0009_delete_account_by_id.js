const { app } = require("@azure/functions");
const { MongoClient } = require("mongodb");
const { StatusCodes } = require("http-status-codes");

const { success, getDateNowFormat, getDateNow } = require("../../utils");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config/db");
const { ERROR_MESSAGE } = require("../../constant/error_message");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0009_delete_account_by_id", {
  methods: ["DELETE"],
  authLevel: "anonymous",
  route: "accounts/delete/deleteById/:id",
  handler: async (request, context) => {
    context.log(`Http function processed request for url "${request.url}"`);

    const id = request.params.get("id");

    await client.connect();
    const database = client.db(DB_NAME);
    const collection = database.collection(COLLECTION.ACCOUNT);

    const account = await collection.findOne({ id: id });
    if (!account) {
      return (context.res = {
        status: StatusCodes.NOT_FOUND,
        body: success(data, ERROR_MESSAGE.GET_ACCOUNT_BY_ID_NOT_FOUND),
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const result = await collection.findOneAndUpdate(
      { id: id },
      {
        username: `deleted-${account.username}-${getDateNowFormat(
          "DD/MM/YYYY"
        )}`,
        deleted: true,
        deletedAt: getDateNow(),
      }
    );
    console.log("result: ", result);
    return (context.res = {
      status: StatusCodes.OK,
      body: success(true, null),
      headers: {
        "Content-Type": "application/json",
      },
    });
  },
});
