const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");

const { success } = require("../../utils");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { ERROR_MESSAGE } = require("../../constant/error_message");
const { HEADERS } = require("../../constant/header");
const { POST_TYPE } = require("../../constant/post_type");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0016_get_post_by_slug", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "posts/getByCategoryId/{categoryId}",
  handler: async (request, context) => {
    context.log(`Http function processed request for url "${request.url}"`);

    const categoryId = request.params.categoryId;

    await client.connect();
    const database = client.db(DB_NAME);
    const collection = database.collection(COLLECTION.POST);
    const fileCollection = database.collection(COLLECTION.FILE);
    const categoryCollection = database.collection(COLLECTION.POST_CATEGORIES);

    const posts = await collection
      .find({
        categoryId: new ObjectId(categoryId),
      })
      .toArray();

    if (posts?.length) {
      const bannerIds = posts.map((e) => new ObjectId(e.banner));
      const categoryIds = posts.map((e) => new ObjectId(e.categoryId));

      const [banners, categories] = await Promise.all([
        fileCollection
          .find({
            _id: {
              $in: bannerIds,
            },
          })
          .toArray(),
        categoryCollection
          .find({
            _id: {
              $in: categoryIds,
            },
          })
          .toArray(),
      ]);

      const postFormated = posts.map((e) => {
        const banner = banners.find((b) => b._id == e.banner);
        const category = categories.find((c) => c._id == e.categoryId);

        return {
          ...e,
          banner: banner ? banner : null,
          categoryId: category ? category : null,
        };
      });

      return (context.res = {
        status: StatusCodes.OK,
        body: success({ postFormated }, null),
        headers: HEADERS,
      });
    }

    return (context.res = {
      status: StatusCodes.NOT_FOUND,
      body: success(null, ERROR_MESSAGE.NOT_FOUND),
      headers: HEADERS,
    });
  },
});
