const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");

const { success } = require("../../utils");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { HEADERS } = require("../../constant/header");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0044_homepage_create", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "homepage/create",
  handler: async (request, context) => {
    try {
      context.log(`Http function processed request for url "${request.url}"`);

      const data = await request.json();

      await client.connect();
      const database = client.db(DB_NAME);
      const collection = database.collection(COLLECTION.HOMEPAGE);

      data.slides = data.slides.map((slide) => ({
        ...slide,
        file: new ObjectId(slide.file),
      }));

      const _id = new ObjectId();

      await collection.insertOne({ _id, ...data });

      return (context.res = {
        status: StatusCodes.OK,
        body: success(
          {
            _id,
          },
          null
        ),
        headers: HEADERS,
      });
    } catch (e) {
      console.log("err: ", e);
      return (context.res = {
        status: StatusCodes.BAD_REQUEST,
        body: success(null, "Đã có lỗi xảy ra vui lòng thử lại."),
        headers: HEADERS,
      });
    }
  },
});
