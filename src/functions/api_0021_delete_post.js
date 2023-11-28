const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");

const { success } = require("../../utils");

const { validateUpdateAccount } = require("../../validations/update_account");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { ERROR_MESSAGE } = require("../../constant/error_message");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0021_update_post", {
  methods: ["DELET"],
  authLevel: "anonymous",
  route: "delete/deleteById/:id",
  handler: async (request, context) => {
    context.log(`Http function processed request for url "${request.url}"`);

    const id = request.params.id;

    await client.connect();
    const database = client.db(DB_NAME);
    const collection = database.collection(COLLECTION.POST);

    let post = await collection.findOne({ _id: new ObjectId(id) });

    if (!post) {
      return (context.res = {
        status: StatusCodes.NOT_FOUND,
        body: success(null, "Bài viết không tồn tại."),
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), deleted: false },
      {
        $set: {
          deleted: true,
          slug: post.slug + "-" + Date.now(),
        },
      }
    );

    return result;
  },
});
