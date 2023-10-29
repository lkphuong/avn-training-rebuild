// const { app } = require("@azure/functions");
// const { MongoClient } = require("mongodb");
// const { StatusCodes } = require("http-status-codes");
// const { v4: uuidv4 } = require("uuid");
// const { success } = require("../../utils");

// const { validateCreateAccountDto } = require("../../validations/add-account");

// const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config/db");
// const { ACCOUNT_TYPE } = require("../../constant/account_type");

// const client = new MongoClient(CONNECTION_STRING);
// await client.connect();
// const database = client.db(DB_NAME);
// const collection = database.collection(COLLECTION.ACCOUNT);

// app.http("add-account", {
//   methods: ["POST"],
//   authLevel: "anonymous",
//   route: "accounts/create",
//   handler: async (request, context) => {
//     context.log(`Http function processed request for url`);

//     const validationErrors = validateCreateAccountDto(data);

//     if (validationErrors.length > 0) {
//       return (context.res = {
//         status: StatusCodes.BAD_REQUEST,
//         body: success(null, JSON.stringify(validationErrors)),
//       });
//     }

//     await client.connect();
//     const database = client.db(DB_NAME);
//     const collection = database.collection(COLLECTION.ACCOUNT);
//     const groupCollection = database.collection(COLLECTION.GROUP);
//     const userCollection = database.collection(COLLECTION.USERS);
//     const userGroupCollection = database.collection(COLLECTION.USER_GROUP);
//     let user = null;
//     let userGroup = null;

//     const groups = await groupCollection.find({});
//     const accountId = uuidv4();

//     const createAccountParam = request.body;
//     if (!createAccountParam.isAdmin) {
//       const { dateOutOfWork, department, unit, section, position } =
//         createAccountParam;

//       const userParam = {
//         dateOutOfWork,
//         department,
//         unit,
//         section,
//         position,
//       };

//       const groupUser = groups.find((g) => g.name == ACCOUNT_TYPE.USER);

//       const [user, userGroup] = await Promise.all([
//         await userCollection.insertOne({ ...userParam }),
//         await userGroupCollection.insertOne({
//           groupId: groupUser.id,
//           userId: accountId,
//         }),
//       ]);
//     } else {
//       const groupAdmin = groups.find((g) => g.name == ACCOUNT_TYPE.ADMIN);

//       await userGroupCollection.insertOne({
//         groupId: groupAdmin.id,
//         userId: accountId,
//       });
//     }

//     const account = await collection.insertOne({
//       id: accountId,
//       userId: user?.id,
//     });

//     return (context.res = {
//       status: 200,
//       body: success(account, null),
//     });
//   },
// });
