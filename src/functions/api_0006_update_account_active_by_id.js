const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");
const { success, decodeJWT, authorization } = require("../../utils");

const {
  validateUpdateActiveAccount,
} = require("../../validations/update_active_account");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { ERROR_MESSAGE } = require("../../constant/error_message");
const { HEADERS } = require("../../constant/header");
const { ROLE } = require("../../constant/role");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0006_update_account_active_by_id", {
  methods: ["PUT"],
  authLevel: "anonymous",
  route: "accounts/update/updateActiveById/{id}",
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
    const data = await request.json();

    const validationErrors = validateUpdateActiveAccount(data);
    if (validationErrors.length > 0) {
      return (context.res = {
        status: StatusCodes.BAD_REQUEST,
        body: success(null, validationErrors[0], validationErrors),
      });
    }

    await client.connect();
    const database = client.db(DB_NAME);
    const collection = database.collection(COLLECTION.ACCOUNT);

    const account = await collection.findOne({ _id: new ObjectId(id) });

    if (!account) {
      return (context.res = {
        status: StatusCodes.NOT_FOUND,
        body: success(null, ERROR_MESSAGE.GET_ACCOUNT_BY_ID_NOT_FOUND),
        headers: HEADERS,
      });
    }

    const userUpdate = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          active: data.status,
        },
      }
    );

    return (context.res = {
      status: StatusCodes.OK,
      body: success({ _id: account._id }, null),
      headers: {
        "Content-Type": "application/json",
      },
    });
  },
});
