const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");

const { success, decodeJWT } = require("../../utils");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { HEADERS } = require("../../constant/header");
const { DEFAULT_MAX_ITEM_PER_PAGE } = require("../../constant/setting");
const { SORT_BY } = require("../../constant/sort_by");
const { SORT_TYPE } = require("../../constant/sort_type");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0046_post_user_get_by_post", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "post-users/getByPostId/:postId",
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

      const postId = request.params.postId;

      const query = request.query;

      await client.connect();
      const database = client.db(DB_NAME);
      const collection = database.collection(COLLECTION.POST_USER);
      const accountCollection = database.collection(COLLECTION.ACCOUNT);

      if (query) {
        const limit = query.limit || DEFAULT_MAX_ITEM_PER_PAGE;
        const page = query.page || 1;
        const offset = (page - 1) * limit;
        let sortBy = query.sortBy || "-" + SORT_BY.CREATED_AT;

        if (query.sortType === SORT_TYPE.ASC) {
          sortBy = query.sortBy;
        }

        const userVieweds = await collection
          .find({ ...query, postId: postId })
          .skip(offset)
          .limit(limit)
          .sort(sortBy)
          .toArray();

        countVieweds = await collection.countDocuments({
          ...query,
          postId: postId,
        });

        const accountIds = userVieweds.map((e) => e.accountId);

        const accounts = await accountCollection.find({
          _id: { $in: accountIds },
        });

        userViewedFormateds = userVieweds.map((userViewed) => {
          const account = accounts.find((a) => a._id == userViewed.accountId);
          return {
            ...userViewed,
            userId: account,
          };
        });
      } else {
        const userVieweds = await collection.find({ postId: postId }).toArray();

        countVieweds = await collection.countDocuments({
          postId: postId,
        });

        const accountIds = userVieweds.map((e) => e.accountId);

        const accounts = await accountCollection.find({
          _id: { $in: accountIds },
        });

        userViewedFormated = userVieweds.map((userViewFormated) => {
          const account = accounts.find((a) => a._id == userViewed.accountId);
          return {
            ...userViewed,
            userId: account,
          };
        });
      }

      const userViewedFormateds = await findUserViewedByPost(
        postId,
        query,
        collection,
        accountCollection
      );

      const userViewedDetails = [];

      userViewedFormateds.data.forEach((userViewed) => {
        userViewedDetails.push({
          done: userViewed?.done ?? false,
          duration: userViewed?.duration ?? "",
          createdAt: userViewed?.createdAt ?? "",
          doneAt: userViewed?.doneAt ?? "",
          account: userViewed,
        });
      });

      return (context.res = {
        status: StatusCodes.OK,
        body: success(
          {
            total: userViewedFormateds.total,
            data: userViewedDetails,
          },
          null
        ),
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
