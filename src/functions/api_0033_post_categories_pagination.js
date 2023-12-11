const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");
const { success, _slugify } = require("../../utils");

const { ERROR_MESSAGE } = require("../../constant/error_message");
const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { SORT_BY } = require("../../constant/sort_by");
const { SORT_TYPE } = require("../../constant/sort_type");
const { DEFAULT_MAX_ITEM_PER_PAGE } = require("../../constant/setting");

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
          status: StatusCodes.BAD_REQUEST,
          body: success(null, "Vui lòng đăng nhập trước khi gọi request."),
          headers: HEADERS,
        });
      }

      await client.connect();
      const database = client.db(DB_NAME);
      const collection = database.collection(COLLECTION.POST_CATEGORIES);
      const fileCollection = database.collection(COLLECTION.FILE);

      const query = request.query;
      const limit = query.limit || DEFAULT_MAX_ITEM_PER_PAGE;
      const page = query.page || 1;
      const offset = (page - 1) * limit;
      let sortBy = SORT_BY.SORT_ORDER;
      let createdAt = SORT_BY.CREATED_AT;
      let sortType = SORT_TYPE.DESC;

      if (query.sortType) {
        sortType = query.sortType;
      }

      if (query.sortBy) {
        sortBy = query.sortBy;
      }

      const sort = sortType === SORT_TYPE.DESC ? "-" + sortBy : sortBy;
      const sort2 = sortType === SORT_TYPE.DESC ? "-" + createdAt : createdAt;

      const searchObj = {
        ...query,
        deleted: false,
        lang: { $in: decode?.lang ?? ["vi"] },
      };

      if (query.title) {
        const slug = _slugify(query.title);

        searchObj.slug = {
          $regex: ".*" + slug + ".*",
          $options: "i",
        };
      }

      const categories = await collection
        .find(searchObj)
        .skip(offset)
        .limit(limit)
        .sort(sort)
        .sort(sort2)
        .toArray();

      if (categories?.length) {
        const bannerIds = categories.map((e) => e.banner);
        const bigBannerIds = categories.map((e) => e.bigBanner);

        let topicIds = [];
        if (query.client) {
          topicIds = categories.map((e) => e.topicId);
        }

        const [banners, bigBanners] = await Promise.all([
          fileCollection.find({ _id: { $in: bannerIds } }),
          fileCollection.find({ _id: { $in: bigBannerIds } }),
          topicIds.find({ _id: { $in: topicIds } }),
        ]);

        const categoryFormateds = categories.map((category) => {
          const banner = banners.find((e) => e._id == category.banner) ?? "";
          const bigBanner =
            bigBanners.find((e) => e._id == category.bigBanner) ?? "";
          return {
            banner: banner ?? null,
            bigBanner: bigBanner ?? null,
            ...category,
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
