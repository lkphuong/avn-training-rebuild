const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");

const { success } = require("../../utils");

const { validateUpdateAccount } = require("../../validations/update_account");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config/db");
const { ERROR_MESSAGE } = require("../../constant/error_message");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0007_update_account_by_id", {
  methods: ["PUT"],
  authLevel: "anonymous",
  route: "accounts/update/updateById/{id}",
  handler: async (request, context) => {
    context.log(`Http function processed request for url "${request.url}"`);
    const id = request.params.id;
    const data = await request.json();

    const validationErrors = validateUpdateAccount(data);
    if (validationErrors.length > 0) {
      return (context.res = {
        status: StatusCodes.BAD_REQUEST,
        body: success(
          null,
          validationErrors[0],
          JSON.stringify(validationErrors)
        ),
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    await client.connect();
    const database = client.db(DB_NAME);
    const collection = database.collection(COLLECTION.ACCOUNT);
    const userCollection = database.collection(COLLECTION.USERS);

    const account = await collection.findOne({ _id: new ObjectId(id) });

    if (!account) {
      return (context.res = {
        status: StatusCodes.NOT_FOUND,
        body: success(null, ERROR_MESSAGE.GET_ACCOUNT_BY_ID_NOT_FOUND),
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    if (account.userId) {
      await userCollection.findOneAndUpdate(
        { userId: new ObjectId(account.userId) },
        {
          $set: {
            department: data.department,
            dateOutOfWork: data.dateOutOfWork,
            unit: data.unit,
            section: data.section,
            position: data.position,
          },
        }
      );
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: { ...data },
      }
    );

    return (context.res = {
      status: StatusCodes.OK,
      body: success({ _id: id }, null),
      headers: {
        "Content-Type": "application/json",
      },
    });
  },
});
