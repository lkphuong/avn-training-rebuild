const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");

const { success, decodeJWT } = require("../../utils");

const { validateUpdateAccount } = require("../../validations/update_account");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { ERROR_MESSAGE } = require("../../constant/error_message");
const { HEADERS } = require("../../constant/header");
const { ACCOUNT_TYPE } = require("../../constant/account_type");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0007_update_account_by_id", {
  methods: ["PUT"],
  authLevel: "anonymous",
  route: "accounts/update/updateById/{id}",
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

    const id = request.params.id;
    const data = await request.json();

    const validationErrors = validateUpdateAccount(data);
    if (validationErrors.length > 0) {
      return (context.res = {
        status: StatusCodes.BAD_REQUEST,
        body: success(
          null,
          validationErrors[0],
          JSON.stringify(validationErrors)
        ),
        headers: HEADERS,
      });
    }

    await client.connect();
    const database = client.db(DB_NAME);
    const collection = database.collection(COLLECTION.ACCOUNT);
    const userCollection = database.collection(COLLECTION.USERS);
    const userGroupCollection = database.collection(COLLECTION.USER_GROUP);
    const groupCollection = database.collection(COLLECTION.GROUP);

    const account = await collection.findOne({ _id: new ObjectId(id) });

    if (!account) {
      return (context.res = {
        status: StatusCodes.NOT_FOUND,
        body: success(null, ERROR_MESSAGE.GET_ACCOUNT_BY_ID_NOT_FOUND),
        headers: HEADERS,
      });
    }

    if (account.userId) {
      await userCollection.findOneAndUpdate(
        { _id: account.userId },
        {
          $set: {
            department: data.department,
            dateOutOfWork: data.dateOutOfWork,
            unit: data.unit,
            section: data.section,
            position: data.position,
          },
        }
      );
    }

    if (data._id) {
      delete data._id;
      delete data.createdAt;
    }

    await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: { ...data },
      }
    );

    const groups = await groupCollection.find({}).toArray();
    let groupAdmin;
    if (data.isAdmin == 1) {
      groupAdmin = groups.find((g) => g.name === ACCOUNT_TYPE.ADMIN);
    } else if (data.isAdmin == 2) {
      groupAdmin = groups.find((g) => g.name === ACCOUNT_TYPE.IT);
    } else {
      groupAdmin = groups.find((g) => g.name === ACCOUNT_TYPE.USER);
    }

    const userGroup = await userGroupCollection.findOne({
      userId: account.userId,
    });
    if (userGroup) {
      await userGroupCollection.findOneAndUpdate(
        { userId: account.userId },
        {
          $set: {
            groupId: groupAdmin._id,
          },
        }
      );
    } else {
      await userGroupCollection.insertOne({
        userId: account.userId,
        groupId: groupAdmin._id,
      });
    }
    //update user group

    return (context.res = {
      status: StatusCodes.OK,
      body: success({ _id: id }, null),
      headers: HEADERS,
    });
  },
});
