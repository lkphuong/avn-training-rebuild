const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");

const { success } = require("../../utils");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { HEADERS } = require("../../constant/header");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0043_homepage_find_by_lang", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "homepage/findByLang/{lang}",
  handler: async (request, context) => {
    try {
      context.log(`Http function processed request for url "${request.url}"`);

      const lang = request.params.lang;

      await client.connect();
      const database = client.db(DB_NAME);
      const collection = database.collection(COLLECTION.HOMEPAGE);
      const fileCollection = database.collection(COLLECTION.FILE);

      const homepage = await collection.findOne({ lang: lang ?? "vi" });

      if (homepage?.slides?.length) {
        const fileIds = homepage.slides.map((slide) => ({ _id: slide?.file }));
        const files = await fileCollection
          .find({ _id: { $in: fileIds.map((e) => e._id) } })
          .toArray();

        homepage.slides = homepage.slides.map((slide) => {
          const file = files.find((e) => {
            return e._id.toString() === slide.file.toString();
          });

          return { ...slide, file };
        });
      }

      if (!homepage) {
        return (context.res = {
          status: StatusCodes.NOT_FOUND,
          body: success(null, "Không có dữ liệu hiển thị."),
          headers: HEADERS,
        });
      }

      const [smallBanner, bigBanner] = await Promise.all([
        fileCollection.findOne({ _id: homepage.smallBanner }),
        fileCollection.findOne({ _id: homepage.bigBanner }),
      ]);

      return (context.res = {
        status: StatusCodes.OK,
        body: success(
          {
            ...homepage,
            bigBanner: bigBanner ?? null,
            smallBanner: smallBanner ?? null,
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
