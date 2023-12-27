const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");
const { success, _slugify, decodeJWT } = require("../../utils");

const { ERROR_MESSAGE } = require("../../constant/error_message");
const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { SORT_BY } = require("../../constant/sort_by");
const { SORT_TYPE } = require("../../constant/sort_type");
const { DEFAULT_MAX_ITEM_PER_PAGE } = require("../../constant/setting");
const { HEADERS } = require("../../constant/header");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0033_post_categories_pagination", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "post-categories/paging",
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

      await client.connect();
      const database = client.db(DB_NAME);
      const collection = database.collection(COLLECTION.POST_CATEGORIES);
      const fileCollection = database.collection(COLLECTION.FILE);

      const query = request.query;
      const limit = query.get("limit") || DEFAULT_MAX_ITEM_PER_PAGE;
      const page = query.get("page") || 1;
      const offset = (page - 1) * limit;

      const searchObj = {
        deleted: false,
        lang: { $in: decode?.lang ?? ["vi"] },
      };

      if (query.get("title")) {
        const slug = _slugify(query.title);

        searchObj.slug = {
          $regex: ".*" + slug + ".*",
          $options: "i",
        };
      }

      if (query.get("active")) {
        searchObj.active = query.get("active") == "true" ? true : false;
      }

      let sort = { sortOrder: -1 };
      if (query.get("sortType")) {
        sort =
          query.get("sortType") == SORT_TYPE.ASC
            ? { createdAt: 1 }
            : { createdAt: -1 };
      }

      const categories = await collection
        .find(searchObj)
        .sort(sort)
        .skip(offset)
        .limit(limit)
        .toArray();

      if (categories?.length) {
        const bannerIds = categories.map((e) => e.banner);
        const bigBannerIds = categories.map((e) => e.bigBanner);

        let topicIds = [];
        if (query.client) {
          topicIds = categories.map((e) => e.topicId);
        }

        const [banners, bigBanners] = await Promise.all([
          fileCollection.find({ _id: { $in: bannerIds } }).toArray(),
          fileCollection.find({ _id: { $in: bigBannerIds } }).toArray(),
          //topicIds.find({ _id: { $in: topicIds } }),
        ]);

        const categoryFormateds = categories.map((category) => {
          console.log(category.banner);
          const banner =
            banners.find(
              (e) => e._id.toString() == category.banner?.toString()
            ) ?? "";
          const bigBanner =
            bigBanners.find(
              (e) => e._id?.toString() == category.bigBanner?.toString()
            ) ?? "";
          return {
            ...category,
            banner: banner ?? null,
            bigBanner: bigBanner ?? null,
          };
        });

        const total = await collection.countDocuments(searchObj);

        if (total) {
          return (context.res = {
            status: StatusCodes.OK,
            body: success(
              {
                data: categoryFormateds,
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
      }
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
