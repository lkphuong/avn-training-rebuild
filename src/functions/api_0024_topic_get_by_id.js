// const { app } = require("@azure/functions");
// const { MongoClient, ObjectId } = require("mongodb");
// const { StatusCodes } = require("http-status-codes");

// const { success } = require("../../utils");

// const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
// const { ERROR_MESSAGE } = require("../../constant/error_message");
// const { HEADERS } = require("../../constant/header");

// const client = new MongoClient(CONNECTION_STRING);

// app.http("api_0024_topic_get_by_id", {
//   methods: ["GET"],
//   authLevel: "anonymous",
//   route: "topics/getById/{id}",
//   handler: async (request, context) => {
//     context.log(`Http function processed request for url "${request.url}"`);

//     const id = request.params.id;

//     await client.connect();
//     const database = client.db(DB_NAME);
//     const collection = database.collection(COLLECTION.TOPIC);

//     const topic = await collection.findOne({ _id: new ObjectId(id) });

//     if (topic) {
//       return (context.res = {
//         status: StatusCodes.NOT_FOUND,
//         body: success(topic, ERROR_MESSAGE.NO_CONTENT),
//         headers: HEADERS,
//       });
//     }

//     return (context.res = {
//       status: StatusCodes.NOT_FOUND,
//       body: success(null, ERROR_MESSAGE.NO_CONTENT),
//       headers: HEADERS,
//     });
//   },
// });
