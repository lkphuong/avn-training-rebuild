const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");

const { success, decodeJWT } = require("../../utils");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { ERROR_MESSAGE } = require("../../constant/error_message");
const { HEADERS } = require("../../constant/header");
const { POST_TYPE } = require("../../constant/post_type");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0015_get_post_by_slug", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "posts/getBySlug/{slug}",
  handler: async (request, context) => {
    try {
      context.log(`Http function processed request for url "${request.url}"`);

      const token = request.headers.get("authorization");
      const decode = await decodeJWT(token);
      if (!decode) {
        return (context.res = {
          status: StatusCodes.UNAUTHORIZED,
          body: success(null, "Vui lòng đăng nhập trước khi gọi request."),
          headers: HEADERS,
        });
      }

      const slug = request.params.slug;

      await client.connect();
      const database = client.db(DB_NAME);
      const collection = database.collection(COLLECTION.POST);
      const fileCollection = database.collection(COLLECTION.FILE);
      const categoryCollection = database.collection(
        COLLECTION.POST_CATEGORIES
      );
      const postUserCollection = database.collection(COLLECTION.POST_USER);

      const post = await collection.findOne({ slug, deleted: false });

      if (post) {
        const [banner, category] = await Promise.all([
          fileCollection.findOne({
            _id: new ObjectId(post.banner),
          }),
          categoryCollection.findOne({
            _id: new ObjectId(post.categoryId),
          }),
        ]);

        post.banner = banner;
        post.categoryId = category;

        await collection.findOneAndUpdate(
          { slug, deleted: false },
          {
            $set: {
              viewCount: !post.viewCount ? 1 : post.viewCount + 1,
            },
          }
        );
        let userViewed = null;
        if (post.type === POST_TYPE.VIDEO) {
          userViewed = await postUserCollection.findOne({
            accountId: new ObjectId(decode?._id),
            postId: post._id,
          });
        }

        return (context.res = {
          status: StatusCodes.OK,
          body: success({ ...post, statusView: userViewed }, null),
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
