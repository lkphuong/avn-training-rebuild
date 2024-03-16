const { app } = require("@azure/functions");
const { MongoClient } = require("mongodb");
const { StatusCodes } = require("http-status-codes");
const { success, decodeJWT, authorization } = require("../../utils");

const { ERROR_MESSAGE } = require("../../constant/error_message");

const { SORT_TYPE } = require("../../constant/sort_type");
const { DEFAULT_MAX_ITEM_PER_PAGE } = require("../../constant/setting");
const { CONNECTION_STRING, COLLECTION, DB_NAME } = require("../../config");
const { HEADERS } = require("../../constant/header");
const { ROLE } = require("../../constant/role");
const client = new MongoClient(CONNECTION_STRING);

app.http("api_0002_get_account_is_user", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "accounts/users",
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

    await client.connect();
    const database = client.db(DB_NAME);
    const collection = database.collection(COLLECTION.ACCOUNT);
    const userCollection = database.collection(COLLECTION.USERS);

    let query = request.query;

    const limit = query.get("limit") || DEFAULT_MAX_ITEM_PER_PAGE;
    const page = query.get("page") || 1;
    const offset = (page - 1) * limit;

    const sort = query.get("sortType") === SORT_TYPE.ASC ? 1 : -1;

    const keys = Object.keys(query);
    const searchObj = {
      userId: {
        $ne: null,
      },
      deleted: false,
    };

    if (query.get("username")) {
      searchObj.username = {
        $regex: ".*" + query.get("username") + ".*",
        $options: "i",
      };
    }

    if (query.get("name")) {
      searchObj.name = {
        $regex: ".*" + query.get("name") + ".*",
        $options: "i",
      };
    }

    if (query.get("active")) {
      searchObj.active = query.get("active") == "true" ? true : false;
    }

    keys.forEach((key) => (!query[key] ? delete query[key] : ""));

    const accounts = await collection
      .find(searchObj)
      .sort({ createdAt: sort })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .toArray();

    const userIds = accounts.map((e) => e.userId);

    const users = await userCollection
      .find({ _id: { $in: userIds } })
      .toArray();

    let accountsFormated = accounts.map((account) => {
      const {
        username,
        name,
        birthday,
        email,
        gender,
        phoneNumber,
        active,
        lang,
        createdAt,
        _id,
      } = account;

      const user = users.find(
        (e) => e._id.toString() == account.userId.toString()
      );
      return {
        _id,
        username,
        name,
        birthday,
        email,
        gender,
        phoneNumber,
        active,
        lang,
        createdAt,
        userId: {
          position: user?.position,
          dateOutOfWork: user?.dateOutOfWork,
          department: user?.department,
          unit: user?.unit,
          section: user?.section,
        },
      };
    });

    const total = await collection.countDocuments(searchObj);

    if (total) {
      return (context.res = {
        status: StatusCodes.OK,
        body: success(
          {
            data: accountsFormated,
            total: total,
          },
          null
        ),
        headers: HEADERS,
      });
    }
    return (context.res = {
      status: StatusCodes.NOT_FOUND,
      body: success(null, ERROR_MESSAGE.NOT_FOUND),
      headers: HEADERS,
    });
  },
});
