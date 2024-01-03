const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");
const { success, decodeJWT, authorization } = require("../../utils");

const { validateCreateAccount } = require("../../validations/add_account");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { ACCOUNT_TYPE } = require("../../constant/account_type");
const { HEADERS } = require("../../constant/header");
const { ROLE } = require("../../constant/role");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0004_add-account", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "accounts/create",
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

    const groups = await groupCollection.find({}).toArray();
    const accountId = new ObjectId();

    if (!data.isAdmin) {
      const { dateOutOfWork, department, unit, section, position } = data;

      const userParam = {
        dateOutOfWork,
        department,
        unit,
        section,
        position,
      };

      const groupUser = groups.find((g) => g.name == ACCOUNT_TYPE.USER);

      [user, userGroup] = await Promise.all([
        await userCollection.insertOne({ ...userParam, deleted: false }),
        await userGroupCollection.insertOne({
          groupId: groupUser.id,
          userId: accountId,
          deleted: false,
          createdAt: new Date(),
        }),
      ]);
    } else {
      const groupAdmin = groups.find((g) => g.name == ACCOUNT_TYPE.ADMIN);

      await userGroupCollection.insertOne({
        groupId: groupAdmin.id,
        userId: accountId,
        deleted: false,
        createdAt: new Date(),
      });
    }

    const account = await collection.insertOne({
      _id: accountId,
      userId: user?.insertedId,
      ...data,
      active: false,
      deleted: false,
      createdAt: new Date(),
    });

    return (context.res = {
      status: StatusCodes.OK,
      body: success({ _id: account.insertedId }, null),
      headers: HEADERS,
    });
  },
});
