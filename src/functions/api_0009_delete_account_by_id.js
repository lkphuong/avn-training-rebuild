const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");

const {
  success,
  getDateNowFormat,
  getDateNow,
  authorization,
  decodeJWT,
} = require("../../utils");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { ERROR_MESSAGE } = require("../../constant/error_message");
const { HEADERS } = require("../../constant/header");
const { ROLE } = require("../../constant/role");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0009_delete_account_by_id", {
  methods: ["DELETE"],
  authLevel: "anonymous",
  route: "accounts/delete/deleteById/{id}",
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

    const account = await collection.findOne({
      _id: new ObjectId(id),
      deleted: false,
    });
    if (!account) {
      return (context.res = {
        status: StatusCodes.NOT_FOUND,
        body: success(null, ERROR_MESSAGE.GET_ACCOUNT_BY_ID_NOT_FOUND),
        headers: HEADERS,
      });
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          username: `deleted-${account.username}-${getDateNowFormat(
            "DD/MM/YYYY"
          )}`,
          deleted: true,
          deletedAt: getDateNow(),
        },
      }
    );
    console.log("result: ", result);
    return (context.res = {
      status: StatusCodes.OK,
      body: success({ username: result.username }, null, null),
      headers: HEADERS,
    });
  },
});
