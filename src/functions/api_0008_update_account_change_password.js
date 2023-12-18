const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");
const { success, decodeJWT } = require("../../utils");

const {
  validateChangePassword,
} = require("../../validations/change_password_account");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { BCRYPT_SALT } = require("../../constant/setting");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0008_update_account_change_password", {
  methods: ["PUT"],
  authLevel: "anonymous",
  route: "accounts/change-password",
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

    const data = await request.json();
    const validationErrors = validateChangePassword(data);
    if (validationErrors.length > 0) {
      return (context.res = {
        status: StatusCodes.BAD_REQUEST,
        body: success(null, validationErrors[0], validationErrors),
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    await client.connect();
    const database = client.db(DB_NAME);
    const collection = database.collection(COLLECTION.ACCOUNT);
    const userGroupCollection = database.collection(COLLECTION.USER_GROUP);
    const groupCollection = database.collection(COLLECTION.GROUP);

    const account = await collection.findOne({
      username: data.username,
      active: true,
    });

    if (!account) {
      return (context.res = {
        status: StatusCodes.NOT_FOUND,
        body: success(null, "Người dùng không tồn tại"),
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // const isMatch = await bcrypt.compare(data.oldPassword, account.password);

    // if (!isMatch) {
    //   return (context.res = {
    //     status: StatusCodes.BAD_REQUEST,
    //     body: success(null, "Username hoặc mật khẩu không chính xác"),
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //   });
    // }

    const userGroup = await userGroupCollection.findOne({
      userId: new ObjectId(account._id),
    });

    const group = userGroup
      ? await groupCollection.findOne({
          _id: new ObjectId(userGroup.groupId),
        })
      : null;

    const _account = { ...account, role: group?.name };

    if (!_account) {
      return (context.res = {
        status: StatusCodes.BAD_REQUEST,
        body: success(null, "Username hoặc mật khẩu không chính xác"),
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // const newPassword = await bcrypt.hash(data.newPassword, BCRYPT_SALT);
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(account._id) },
      {
        $set: {
          password: newPassword,
        },
      }
    );
    console.log("result: ", result);
    return (context.res = {
      status: StatusCodes.OK,
      body: success(true ? true : false, null),
      headers: {
        "Content-Type": "application/json",
      },
    });
  },
});
