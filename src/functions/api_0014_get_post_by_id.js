const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");

const { success } = require("../../utils");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { ERROR_MESSAGE } = require("../../constant/error_message");
const { HEADERS } = require("../../constant/header");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0014_get_post_by_id", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  route: "posts/getById/{id}",
  handler: async (request, context) => {
    context.log(`Http function processed request for url "${request.url}"`);

    const id = request.params.id;

    await client.connect();
    const database = client.db(DB_NAME);
    const collection = database.collection(COLLECTION.POST);
    const fileCollection = database.collection(COLLECTION.FILE);
    const categoryCollection = database.collection(COLLECTION.POST_CATEGORIES);
    const topicCollection = database.collection(COLLECTION.TOPIC);

    const post = await collection.findOne({ _id: new ObjectId(id) });

    if (post) {
      console.log("post: ", post);
      const banner = await fileCollection.findOne({
        _id: new ObjectId(post.banner),
      });

      const category = await categoryCollection.findOne({
        _id: new ObjectId(post.categoryId),
      });

      const topic = category
        ? await topicCollection.findOne({ _id: new ObjectId(category.topicId) })
        : null;

      const {
        _id,
        title,
        description,
        content,
        duration,
        lang,
        slug,
        type,
        youtubeId,
        sortOrder,
      } = post;

      const postFormated = {
        _id,
        title,
        description,
        content,
        lang,
        banner: banner
          ? {
              _id: banner._id,
              path: banner.path,
              thumbPath: banner.path,
              sourceType: banner.sourceType,
            }
          : null,
        duration,
        slug,
        type,
        youtubeId,
        sortOrder,
        categoryId: category
          ? {
              _id: category._id,
              active: category.active,
              lang: category.lang,
              description: category.description,
              name: category.name,
              topicId: topic
                ? {
                    _id: topic._id,
                    name: topic.name,
                  }
                : null,
            }
          : null,
      };

      return (context.res = {
        status: StatusCodes.NOT_FOUND,
        body: success(postFormated, ERROR_MESSAGE.NO_CONTENT),
        headers: HEADERS,
      });
    }

    return (context.res = {
      status: StatusCodes.NOT_FOUND,
      body: success(null, ERROR_MESSAGE.NO_CONTENT),
      headers: HEADERS,
    });
  },
});
