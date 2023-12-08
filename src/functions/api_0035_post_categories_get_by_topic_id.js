const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");

const { success } = require("../../utils");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { ERROR_MESSAGE } = require("../../constant/error_message");
const { HEADERS } = require("../../constant/header");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0035_post_categories_get_by_topic_id", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  route: "post-categories/getByTopicId/{topicId}",
  handler: async (request, context) => {
    try {
      context.log(`Http function processed request for url "${request.url}"`);

      const topicId = request.params.topicId;

      await client.connect();
      const database = client.db(DB_NAME);
      const collection = database.collection(COLLECTION.POST_CATEGORIES);
      const fileCollection = database.collection(COLLECTION.FILE);

      const postCategories = await collection
        .find({ topicId: new ObjectId(topicId) })
        .toArray();

      if (postCategories?.length) {
        const bannerIds = postCategories.map((e) => e.banner);
        const bigBannerIds = postCategories.map((e) => e.bigBanner);

        const [banners, bigBanners] = await Promise.all([
          fileCollection.find({ _id: { $in: bannerIds } }).toArray(),
          fileCollection.find({ _id: { $in: bigBannerIds } }).toArray(),
        ]);

        const postCategoryFormated = postCategories.map((category) => {
          const banner = category?.banner
            ? banners.find(
                (e) => e._id.toString() == category?.banner.toString()
              )
            : null;
          const bigBanner = category?.bigBanner
            ? bigBanners.find((e) => e._id.toString() == category?.bigBanner)
            : null;
          return {
            ...category,
            banner: banner ?? null,
            bigBanner: bigBanner ?? null,
          };
        });

        return (context.res = {
          status: StatusCodes.OK,
          body: success(postCategoryFormated, null),
          headers: HEADERS,
        });
      }

      return (context.res = {
        status: StatusCodes.NOT_FOUND,
        body: success(null, ERROR_MESSAGE.NOT_FOUND),
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
