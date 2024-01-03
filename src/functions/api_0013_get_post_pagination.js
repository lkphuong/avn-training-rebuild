const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");
const { success, decodeJWT, authorization } = require("../../utils");

const { ERROR_MESSAGE } = require("../../constant/error_message");
const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { SORT_BY } = require("../../constant/sort_by");
const { SORT_TYPE } = require("../../constant/sort_type");
const { DEFAULT_MAX_ITEM_PER_PAGE } = require("../../constant/setting");
const { ROLE } = require("../../constant/role");
const { HEADERS } = require("../../constant/header");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0013_get_post_pagination", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "posts/paging",
  handler: async (request, context) => {
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

    if (!authorization(decode, ROLE.ADMIN)) {
      return (context.res = {
        status: StatusCodes.FORBIDDEN,
        body: success(null, "Không có quyền gọi request."),
        headers: HEADERS,
      });
    }

    await client.connect();
    const database = client.db(DB_NAME);
    const collection = database.collection(COLLECTION.POST);
    const fileCollection = database.collection(COLLECTION.FILE);
    const categoryCollection = database.collection(COLLECTION.POST_CATEGORIES);

    const query = request.query;

    const limit = query.get("limit") || DEFAULT_MAX_ITEM_PER_PAGE;
    const page = query.get("page") || 1;
    const offset = (page - 1) * limit;

    const searchObj = {
      deleted: false,
      ...query,
    };

    if (query.get("categoryId")) {
      searchObj.categoryId = new ObjectId(query.get("categoryId"));
    }

    if (query.get("active")) {
      searchObj.active = query.get("active") == "true" ? true : false;
    }

    if (query.get("topicId")) {
      searchObj.topicId = new ObjectId(query.get("topicId"));
    }

    let sort = { sortOrder: -1 };
    if (query.get("sortType")) {
      sort =
        query.get("sortType") == SORT_TYPE.ASC
          ? { createdAt: 1 }
          : { createdAt: -1 };
    }

    console.log("searchObj", searchObj);

    const posts = await collection
      .find(searchObj)
      .sort(sort)
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .toArray();

    let files = [],
      categories = [];
    if (posts?.length) {
      const fileIds = posts.map((e) => e.banner);
      const categoryIds = posts.map((e) => e.categoryId);

      [files, categories] = await Promise.all([
        fileCollection.find({ _id: { $in: fileIds } }).toArray(),
        categoryCollection.find({ _id: { $in: categoryIds } }).toArray(),
      ]);
    }

    let postFormated = posts.map((post) => {
      const banner = files.find((e) => e.id == post.banner);
      const category = categories.find((e) => e.id == post.categoryId);

      return {
        ...post,
        banner: banner
          ? {
              _id: banner._id,
              path: banner.path,
              thumbPath: banner.thumbPath,
              sourceType: banner.sourceType,
            }
          : null,
        categoryId: category
          ? {
              _id: category._id,
              description: category.description,
              name: category.name,
              active: category.active,
              lang: category.lang,
            }
          : null,
      };
    });

    const total = await collection.countDocuments(searchObj);
    if (total) {
      return (context.res = {
        status: StatusCodes.OK,
        body: success(
          {
            data: postFormated,
            total: total,
          },
          null
        ),
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
