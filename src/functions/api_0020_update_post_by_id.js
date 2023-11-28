const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");
const { success } = require("../../utils");

const { ERROR_MESSAGE } = require("../../constant/error_message");

const { SORT_BY } = require("../../constant/sort_by");
const { SORT_TYPE } = require("../../constant/sort_type");
const { validateCreatePost } = require("../../validations/create_post");
const { DEFAULT_MAX_ITEM_PER_PAGE } = require("../../constant/setting");
const { CONNECTION_STRING, COLLECTION, DB_NAME } = require("../../config");
const { HEADERS } = require("../../constant/header");
const { SOURCE_LINK } = require("../../constant/exam_type");
const { default: slugify } = require("slugify");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0020_update_by_id", {
  methods: ["PUT"],
  authLevel: "anonymous",
  route: "update/updateById/{id}",
  handler: async (request, context) => {
    context.log(`Http function processed request for url "${request.url}"`);

    const data = await request.json();
    const id = request.params.id;
    const token = req.headers.authorization;
    const decode = await decodeJWT(token);
    if (!decode) {
    }

    const validationErrors = validateCreatePost(data);

    if (validationErrors.length > 0) {
      return (context.res = {
        status: StatusCodes.BAD_REQUEST,
        body: success(null, null, validationErrors),
        headers: HEADERS,
      });
    }

    await client.connect();
    const database = client.db(DB_NAME);
    const collection = database.collection(COLLECTION.POST);
    const examCollection = database.collection(COLLECTION.EXAM);

    const post = await collection.findOne({ _id: new ObjectId(id) });
    if (!post) {
      return (context.res = {
        status: StatusCodes.NOT_FOUND,
        body: success(null, "Không tìm thấy bài viết"),
        headers: HEADERS,
      });
    }

    if (post.title !== data.title) {
      const slug = slugify(data.title, { locale: "vi", lower: true });

      const existPost = collection.findOne({ slug });

      if (existPost) {
        return (context.res = {
          status: StatusCodes.NOT_FOUND,
          body: success(null, "Duplicated field"),
          headers: HEADERS,
        });
      }
    }

    let examResult;
    examResult = await examCollection.findOne({
      sourceId: new ObjectId(post._id),
      sourceType: SOURCE_LINK.POST,
    });

    if (!examResult) {
      examResult = await examCollection.findOne({
        sourceId: post.categoryId,
        sourceType: SOURCE_LINK.POST_CATEGORY,
      });
    }

    if (examResult) {
      await examCollection.findOneAndUpdate({ _id });
    }
  },
});
