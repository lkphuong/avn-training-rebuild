const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");
const { success } = require("../../utils");

const { validateCreateAccount } = require("../../validations/add_account");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { ACCOUNT_TYPE } = require("../../constant/account_type");
const { HEADERS } = require("../../constant/header");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0004_add-account", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "accounts/create",
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

    await client.connect();
    const database = client.db(DB_NAME);
    const collection = database.collection(COLLECTION.ACCOUNT);
    const groupCollection = database.collection(COLLECTION.GROUP);
    const userCollection = database.collection(COLLECTION.USERS);
    const userGroupCollection = database.collection(COLLECTION.USER_GROUP);
    let user = null;
    let userGroup = null;

    const groups = await groupCollection.find({}).toArray();
    const accountId = new ObjectId();

    const createAccountParam = request.body;
    if (!createAccountParam.isAdmin) {
      const { dateOutOfWork, department, unit, section, position } =
        createAccountParam;

      const userParam = {
        dateOutOfWork,
        department,
        unit,
        section,
        position,
      };

      const groupUser = groups.find((g) => g.name == ACCOUNT_TYPE.USER);

      const [user, userGroup] = await Promise.all([
        await userCollection.insertOne({ ...userParam }),
        await userGroupCollection.insertOne({
          groupId: groupUser.id,
          userId: accountId,
        }),
      ]);
    } else {
      const groupAdmin = groups.find((g) => g.name == ACCOUNT_TYPE.ADMIN);

      await userGroupCollection.insertOne({
        groupId: groupAdmin.id,
        userId: accountId,
      });
    }

    const account = await collection.insertOne({
      id: accountId,
      userId: user?.id,
    });

    return (context.res = {
      status: StatusCodes.OK,
      body: success({ _id: account.insertedId }, null),
      headers: HEADERS,
    });
  },
});
