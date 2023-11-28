const { app } = require("@azure/functions");
const { MongoClient } = require("mongodb");
const { StatusCodes } = require("http-status-codes");

const { success, decodeJWT } = require("../../utils");
const { ERROR_MESSAGE } = require("../../constant/error_message");
const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { HEADERS } = require("../../constant/header");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0023_topic_get_pagination", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "topics/paging",
  handler: async (request, context) => {
    context.log(`Http function processed request for url "${request.url}"`);

    const query = req.query;
    const token = req.headers.authorization;

    const decode = await decodeJWT(token);

    await client.connect();
    const database = client.db(DB_NAME);
    const collection = database.collection(COLLECTION.TOPIC);
    const fileCollection = database.collection(COLLECTION.FILE);

    //
    const limit = query.limit || 10;
    const page = query.page || 1;
    const offset = (page - 1) * limit;
    let sortBy = "sortOrder";
    let sortType = "desc";

    if (query.sortType) {
      sortType = query.sortType;
    }

    if (query.sortBy) {
      sortBy = query.sortBy;
    }

    const sort = sortType === SORT_TYPE.DESC ? "-" + sortBy : sortBy;

    const searchObj = {
      deleted: false,
      lang: { $in: lang },
    };

    if (query.active) {
      searchObj.active = query.active;
    }

    if (query.isPin) {
      searchObj.isPin = query.isPin;
    }

    const topics = await collection
      .find(searchObj)
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .sort(sort)
      .toArray();

    if (topics?.length > 0) {
      const fileIds = topics.map((e) => e.banner);
      const files = await fileCollection.find({ _id: { $in: fileIds } });

      const topicFormated = topics.map((topic) => {
        const banner = files.find((file) => (file._id = topic.banner));
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
      body: success(null, ERROR_MESSAGE.NO_CONTENT),
      headers: HEADERS,
    });
  },
});
