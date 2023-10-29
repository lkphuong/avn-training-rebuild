const { app } = require("@azure/functions");
const { MongoClient } = require("mongodb");
const { StatusCodes } = require("http-status-codes");
const { success } = require("../../utils");

const { ERROR_MESSAGE } = require("../../constant/error_message");
const { SORT_BY } = require("../../constant/sort_by");
const { DEFAULT_MAX_ITEM_PER_PAGE } = require("../../constant/setting");
const { CONNECTION_STRING, COLLECTION, DB_NAME } = require("../../config/db");
const client = new MongoClient(CONNECTION_STRING);

app.http("get-account-is-user", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  route: "users",
  handler: async (request, context) => {
    context.log(`Http function processed request for url "${request.url}"`);

    await client.connect();
    const database = client.db(DB_NAME);
    const collection = database.collection(COLLECTION.ACCOUNT);
    const userCollection = database.collection(COLLECTION.USERS);

    const limit = request.query.get("limit") || DEFAULT_MAX_ITEM_PER_PAGE;
    const page = request.query.get("page") || 1;
    const offset = (page - 1) * limit;
    let sortBy = query.sortBy || SORT_BY.CREATED_AT;

    if (query.sortType === SORT_TYPE.DESC) {
      sortBy = "-" + (query.sortBy || SORT_BY.CREATED_AT);
    }

    const keys = Object.keys(query);

    const searchObj = {
      ...query,
      userId: {
        $ne: null,
      },
      deleted: false,
    };

    if (query.username) {
      searchObj.username = {
        $regex: ".*" + query.username + ".*",
        $options: "i",
      };
    }

    if (query.name) {
      searchObj.name = {
        $regex: ".*" + query.name + ".*",
        $options: "i",
      };
    }

    keys.forEach((key) => (!query[key] ? delete query[key] : ""));

    const accounts = await collection
      .find(searchObj)
      .skip(offset)
      .limit(limit)
      .sort(sortBy)
      .exec();

    const user_ids = accounts.map((e) => e.userId);

    const users = await collection.find({ userId: { $in: user_ids } });

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

      const user = users.find((e) => (e.id = account.userId));

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

    const countAccount = await this.accountModel.countDocuments(searchObj);
    user;
    if (total) {
      return (context.res = {
        status: StatusCodes.OK,
        body: success(
          {
            data: accountsFormated,
            total: countAccount,
          },
          ERROR_MESSAGE.NO_CONTENT
        ),
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
    return (context.res = {
      status: StatusCodes.OK,
      body: success(data, ERROR_MESSAGE.NO_CONTENT),
      headers: {
        "Content-Type": "application/json",
      },
    });
  },
});
