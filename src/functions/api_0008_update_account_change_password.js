const { app } = require("@azure/functions");
const { MongoClient } = require("mongodb");
const { StatusCodes } = require("http-status-codes");
const { compareSync, hashSync } = require("bcrypt");

const { success } = require("../../utils");

const {
  validateChangePassword,
} = require("../../validations/change_password_account");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config/db");
const { BCRYPT_SALT } = require("../../constant/setting");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0008_update_account_change_password", {
  methods: ["PUT"],
  authLevel: "anonymous",
  route: "accounts/change-password",
  handler: async (request, context) => {
    context.log(`Http function processed request for url "${request.url}"`);
    const data = request.body;
    const validationErrors = validateChangePassword(data);
    if (validationErrors.length > 0) {
      return (context.res = {
        status: StatusCodes.BAD_REQUEST,
        body: success(null, null, JSON.stringify(validationErrors)),
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

    const isMatch = compareSync(data.password, account.password);

    if (!isMatch) {
      return (context.res = {
        status: StatusCodes.BAD_REQUEST,
        body: success(null, "Username hoặc mật khẩu không chính xác"),
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const userGroup = await userGroupCollection.findOne({ userId: account.id });

    const group = await groupCollection.findOne({ id: userGroup.groupId });

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

    const newPassword = hashSync(data.newPassword, BCRYPT_SALT);
    const result = await collection.findOneAndUpdate(
      { id: account.id },
      {
        password: newPassword,
      }
    );
    return (context.res = {
      status: StatusCodes.OK,
      body: success(result ? true : false),
    });
  },
});
