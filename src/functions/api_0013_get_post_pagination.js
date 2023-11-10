const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");
const { success } = require("../../utils");

const { ERROR_MESSAGE } = require("../../constant/error_message");
const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { SORT_BY } = require("../../constant/sort_by");
const { SORT_TYPE } = require("../../constant/sort_type");
const { DEFAULT_MAX_ITEM_PER_PAGE } = require("../../constant/setting");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0013_get_post_pagination", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "posts/paging",
  handler: async (request, context) => {
    context.log(`Http function processed request for url "${request.url}"`);

    await client.connect();
    const database = client.db(DB_NAME);
    const collection = database.collection(COLLECTION.POST);
    const fileCollection = database.collection(COLLECTION.FILE);
    const categoryCollection = database.collection(COLLECTION.POST_CATEGORIES);

    const query = request.query;

    const limit = query.limit || DEFAULT_MAX_ITEM_PER_PAGE;
    const page = query.page || 1;
    const offset = (page - 1) * limit;
    let sortBy = SORT_BY.SORT_ORDER;
    let sortType = SORT_TYPE.DESC;

    if (query.sortType) {
      sortType = query.sortType;
    }

    if (query.sortBy) {
      sortBy = query.sortBy;
    }

    const sort = sortType === SORT_TYPE.DESC ? "-" + sortBy : sortBy;

    const searchObj = {
      deleted: false,
      ...query,
    };

    if (query.categoryId) {
      searchObj.categoryId = new ObjectId(query.categoryId);
    }

    if (query.active) {
      searchObj.active = query.active;
    }

    const posts = await collection
      .find(searchObj)
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
      const {
        _id,
        title,
        duration,
        type,
        createdAt,
        active,
        lang,
        sortOrder,
        description,
      } = post;

      const banner = files.find((e) => e.id == post.banner);
      const category = categories.find((e) => e.id == post.categoryId);

      return {
        _id,
        title,
        duration,
        type,
        active,
        lang,
        createdAt,
        description,
        sortOrder,
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
      body: success(null, ERROR_MESSAGE.NO_CONTENT),
      headers: HEADERS,
    });
  },
});
