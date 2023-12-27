const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");
const { decodeJWT } = require("../../utils/index");
const { success } = require("../../utils");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { HEADERS } = require("../../constant/header");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0018_get_post_user_by_category", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "posts/user/getByCategoryId/{categoryId}",
  handler: async (request, context) => {
    try {
      context.log(`Http function processed request for url "${request.url}"`);

      const categoryId = request.params.categoryId;
      const query = request.query;

      const token = request.headers.get("authorization");
      const decode = await decodeJWT(token);

      if (!decode) {
        return (context.res = {
          status: StatusCodes.UNAUTHORIZED,
          body: success(null, "Vui lòng đăng nhập trước khi gọi request."),
          headers: HEADERS,
        });
      }

      await client.connect();
      const database = client.db(DB_NAME);
      const collection = database.collection(COLLECTION.POST);
      const categoryCollection = database.collection(
        COLLECTION.POST_CATEGORIES
      );
      const fileCollection = database.collection(COLLECTION.FILE);
      const postUserCollection = database.collection(COLLECTION.POST_USER);

      const posts = await collection
        .find({
          categoryId: new ObjectId(categoryId),
          active: true,
          deleted: false,
        })
        .toArray();

      let files = [],
        categories = [];
      if (posts?.length) {
        const fileIds = posts.map((e) => e.banner);
        const postCategoryIds = posts.map((e) => e.categoryId);
        [files, categories] = await Promise.all([
          fileCollection.find({ _id: { $in: fileIds } }).toArray(),
          categoryCollection.find({ _id: { $in: postCategoryIds } }).toArray(),
        ]);
      }

      const requests = [];
      posts.forEach((post) => {
        const request = postUserCollection.findOne({
          accountId: decode?.username ?? null,
          postId: post._id,
          done: true,
        });

        requests.push(request);
      });

      const results = await Promise.all(requests);

      const returnValues = posts.map((post, index) => {
        const file = files.find((e) => e._id == post.banner);
        const postCategory = categories.find((e) => e._id == post.categoryId);

        return {
          ...post,
          banner: file ?? null,
          categoryId: postCategory ?? null,
          done: results[index] ? true : false,
        };
      });

      return (context.res = {
        status: StatusCodes.OK,
        body: success({ returnValues }, null),
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
