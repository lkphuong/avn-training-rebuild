const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");

const { success } = require("../../utils");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { HEADERS } = require("../../constant/header");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0045_homepage_update", {
  methods: ["PUT"],
  authLevel: "anonymous",
  route: "homepage/update/{id}",
  handler: async (request, context) => {
    try {
      context.log(`Http function processed request for url "${request.url}"`);

      const id = request.params.id;
      const data = await request.json();

      await client.connect();
      const database = client.db(DB_NAME);
      const collection = database.collection(COLLECTION.HOMEPAGE);

      const homepage = await collection.findOne({ _id: new ObjectId(id) });

      data.slides = data.slides.map((slide) => ({
        ...slide,
        file: new ObjectId(slide.file),
      }));

      if (!homepage) {
        return (context.res = {
          status: StatusCodes.NOT_FOUND,
          body: success(null, "Không có dữ liệu hiển thị."),
          headers: HEADERS,
        });
      }

      await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        {
          $set: {
            ...data,
          },
        }
      );

      return (context.res = {
        status: StatusCodes.OK,
        body: success(
          {
            _id: id,
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
