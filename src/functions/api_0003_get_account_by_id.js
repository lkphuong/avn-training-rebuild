const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");

const { success } = require("../../utils");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { ERROR_MESSAGE } = require("../../constant/error_message");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0003_get_account_by_id", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "accounts/getById/{id}",
  handler: async (request, context) => {
    context.log(`Http function processed request for url "${request.url}"`);

    const id = request.params.id;

    await client.connect();
    const database = client.db(DB_NAME);
    const collection = database.collection(COLLECTION.ACCOUNT);
    const userGroupCollection = database.collection(COLLECTION.USER_GROUP);
    const groupCollection = database.collection(COLLECTION.GROUP);

    const account = await collection.findOne({ _id: new ObjectId(id) });

    if (account) {
      const userGroup = await userGroupCollection.findOne({
        userId: new ObjectId(account._id),
      });

      let group = null;
      if (userGroup) {
        group = await groupCollection.findOne({
          _id: new ObjectId(userGroup.groupId),
        });
      }

      const response = {
        id: account.id,
        username: account?.username,
        group: group?.name,
        name: account?.name,
        lang: account?.lang,
      };

      return (context.res = {
        status: StatusCodes.OK,
        body: success(response, null),
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
    return (context.res = {
      status: StatusCodes.NOT_FOUND,
      body: success(data, ERROR_MESSAGE.GET_ACCOUNT_BY_ID_NOT_FOUND),
      headers: {
        "Content-Type": "application/json",
      },
    });
  },
});
