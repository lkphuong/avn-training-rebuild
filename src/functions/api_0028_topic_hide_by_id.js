const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");

const { success } = require("../../utils");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { HEADERS } = require("../../constant/header");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0028_topic_hide_by_id", {
  methods: ["PUT"],
  authLevel: "anonymous",
  route: "topics/update/hideById/{id}",
  handler: async (request, context) => {
    context.log(`Http function processed request for url "${request.url}"`);

    const id = request.params.id;
    const data = await request.json();

    await client.connect();
    const database = client.db(DB_NAME);
    const collection = database.collection(COLLECTION.TOPIC);

    await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: { active: data?.status ?? true },
      }
    );
    return (context.res = {
      status: StatusCodes.OK,
      body: success({ _id: id }, null),
      headers: HEADERS,
    });
  },
});
