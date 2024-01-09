const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");

const { success, decodeJWT, authorization } = require("../../utils");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { ERROR_MESSAGE } = require("../../constant/error_message");
const { HEADERS } = require("../../constant/header");
const { ROLE } = require("../../constant/role");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0003_get_account_by_id", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "accounts/getById/{id}",
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

    const id = request.params.id;

    await client.connect();
    const database = client.db(DB_NAME);
    const collection = database.collection(COLLECTION.ACCOUNT);
    const userGroupCollection = database.collection(COLLECTION.USER_GROUP);
    const groupCollection = database.collection(COLLECTION.GROUP);

    const account = await collection.findOne({ _id: new ObjectId(id) });

    if (account) {
      const userGroup = await userGroupCollection.findOne({
        userId: new ObjectId(account.userId),
      });
      console.log("userGroup: ", userGroup);
      let group = null;
      if (userGroup) {
        group = await groupCollection.findOne({
          _id: new ObjectId(userGroup.groupId),
        });
      }
      console.log("group: ", group);
      const response = {
        _id: account._id,
        username: account?.username,
        group: group?.name,
        isAdmin: group?.name === "admin" ? 1 : group?.name === "it" ? 2 : 0,
        name: account?.name,
        lang: account?.lang,
      };

      return (context.res = {
        status: StatusCodes.OK,
        body: success(response, null),
        headers: HEADERS,
      });
    }
    return (context.res = {
      status: StatusCodes.NOT_FOUND,
      body: success(null, ERROR_MESSAGE.GET_ACCOUNT_BY_ID_NOT_FOUND),
      headers: HEADERS,
    });
  },
});
