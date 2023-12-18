const { app } = require("@azure/functions");
const { MongoClient } = require("mongodb");
const { StatusCodes } = require("http-status-codes");
const { success, decodeJWT, authorization } = require("../../utils");
const { ERROR_MESSAGE } = require("../../constant/error_message");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { HEADERS } = require("../../constant/header");
const { ROLE } = require("../../constant/role");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0001_get_all_account", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "accounts",
  handler: async (request, context) => {
    context.log(`Http function processed request for url`);

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

    await client.connect();
    const database = client.db(DB_NAME);
    const collection = database.collection(COLLECTION.ACCOUNT);
    const data = await collection
      .find({}, { projection: { password: 0 } })
      .toArray();

    if (data?.length) {
      return (context.res = {
        status: StatusCodes.OK,
        body: success(data, null),
        headers: HEADERS,
      });
    }
    return (context.res = {
      status: StatusCodes.OK,
      body: success(data, ERROR_MESSAGE.NOT_FOUND),
      headers: HEADERS,
    });
  },
});
