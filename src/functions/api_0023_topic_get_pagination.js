const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");

const { success, decodeJWT } = require("../../utils");
const { ERROR_MESSAGE } = require("../../constant/error_message");
const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { HEADERS } = require("../../constant/header");
const { SORT_TYPE } = require("../../constant/sort_type");
const { SORT_BY } = require("../../constant/sort_by");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0023_topic_get_pagination", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "topics/paging",
  handler: async (request, context) => {
    try {
      context.log(`Http function processed request for url "${request.url}"`);

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
      const collection = database.collection(COLLECTION.TOPIC);
      const fileCollection = database.collection(COLLECTION.FILE);

      //
      const limit = query.get("limit") || 10;
      const page = query.get("page") || 1;
      const lang = query.get("lang") ?? "vi";
      const offset = (page - 1) * limit;
      let sortBy = SORT_BY.SORT_ORDER;
      let sortType = SORT_TYPE.DESC;

      const searchObj = {
        deleted: false,
        lang: { $in: decode?.lang ?? ["vi"] },
      };

      if (query.get("active")) {
        searchObj.active = query.get("active") == "true" ? true : false;
      }

      if (query.get("isPin")) {
        searchObj.isPin = query.get("isPin") == "true" ? true : false;
      }

      let sort = { sortOrder: -1 };
      if (query.get("sortType")) {
        sort =
          query.get("sortType") == SORT_TYPE.ASC
            ? { createdAt: 1 }
            : { createdAt: -1 };
      }

      const topics = await collection
        .find(searchObj)
        .sort(sort)
        .skip(parseInt(offset))
        .limit(parseInt(limit))
        .toArray();

      if (topics?.length > 0) {
        const fileIds = topics.map((e) => new ObjectId(e.banner));
        const files = await fileCollection
          .find({ _id: { $in: fileIds } })
          .toArray();

        const topicFormated = topics.map((topic) => {
          const banner = files.find(
            (file) => file?._id?.toString() == topic?.banner?.toString()
          );
          return {
            ...topic,
            banner,
          };
        });

        const total = await collection.countDocuments(searchObj);
        return (context.res = {
          status: StatusCodes.OK,
          body: success({ data: topicFormated, total: total }, null),
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
