const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");

const { success, decodeJWT } = require("../../utils");
const { findUserViewedByPost } = require("../../utils/post-user/index");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { HEADERS } = require("../../constant/header");
const { DEFAULT_MAX_ITEM_PER_PAGE } = require("../../constant/setting");
const { SORT_BY } = require("../../constant/sort_by");
const { SORT_TYPE } = require("../../constant/sort_type");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0046_post_user_get_by_post", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "post-users/getByPostId/{postId}",
  handler: async (request, context) => {
    try {
      context.log(`Http function processed request for url "${request.url}"`);

      // const token = request.headers.get("authorization");
      // const decode = await decodeJWT(token);
      // if (!decode) {
      //   return (context.res = {
      //     status: StatusCodes.UNAUTHORIZED,
      //     body: success(null, "Vui lòng đăng nhập trước khi gọi request."),
      //     headers: HEADERS,
      //   });
      // }

      const postId = request.params.postId;

      const query = request.query;

      await client.connect();
      const database = client.db(DB_NAME);
      const collection = database.collection(COLLECTION.POST_USER);
      const accountCollection = database.collection(COLLECTION.ACCOUNT);
      const userCollection = database.collection(COLLECTION.USERS);

      // if (query) {
      //   const limit = query.get("limit") || DEFAULT_MAX_ITEM_PER_PAGE;
      //   const page = query.get("page") || 1;
      //   const offset = (page - 1) * limit;

      //   const searchObj = { deleted: false, ...query };
      //   if (query.get("done")) {
      //     searchObj.done = query.get("done") === "true" ? true : false;
      //   }

      //   const userVieweds = await collection
      //     .find({ ...searchObj, postId: new ObjectId(postId) })
      //     .skip(offset)
      //     .limit(limit)
      //     .sort({ createdAt: 1 })
      //     .toArray();

      //   countVieweds = await collection.countDocuments({
      //     ...query,
      //     postId: new ObjectId(postId),
      //   });

      //   const accountIds = userVieweds.map((e) => e.accountId);

      //   const accounts = await accountCollection
      //     .find({
      //       _id: { $in: accountIds },
      //     })
      //     .toArray();

      //   userViewedFormateds = userVieweds.map((userViewed) => {
      //     const account = accounts.find(
      //       (a) => a._id.toString() == userViewed.accountId.toString()
      //     );
      //     return {
      //       ...userViewed,
      //       userId: account,
      //     };
      //   });
      // } else {
      //   const userVieweds = await collection
      //     .find({ postId: new ObjectId(postId), deleted: false })
      //     .toArray();

      //   countVieweds = await collection.countDocuments({
      //     postId: postId,
      //   });

      //   const accountIds = userVieweds.map((e) => e.accountId);

      //   const accounts = await accountCollection
      //     .find({
      //       _id: { $in: accountIds },
      //     })
      //     .toArray();

      //   userViewedFormated = userVieweds.map((userViewed) => {
      //     const account = accounts.find(
      //       (a) => a._id.toString() == userViewed.accountId.toString()
      //     );
      //     return {
      //       ...userViewed,
      //       userId: account,
      //     };
      //   });
      // }

      const userViewedFormateds = await findUserViewedByPost(
        postId,
        query,
        collection,
        accountCollection,
        userCollection
      );

      const newUserVieweds = [],
        lengthUserViewds = userViewedFormateds?.data?.length ?? 0;

      for (let i = 0; i < lengthUserViewds; i++) {
        const userViewed = userViewedFormateds.data[i];

        const check = newUserVieweds.find((e) => e.email === userViewed.email);

        if (!check) {
          const tmpUserVieweds = userViewedFormateds.data.filter(
            (e) => e.email === userViewed.email
          );

          if (tmpUserVieweds.length === 1) {
            if (tmpUserVieweds[0].doneAt) {
              tmpUserVieweds[0].done = true;
            }
            if (!tmpUserVieweds[0].doneAt && tmpUserVieweds[0].done) {
              tmpUserVieweds[0].doneAt = tmpUserVieweds[0].doneAt = new Date(
                new Date(tmpUserVieweds[0].createdAt).setSeconds(
                  tmpUserVieweds[0].duration
                )
              );
            }
            newUserVieweds.push(tmpUserVieweds[0]);
          } else {
            let tmpUserViewed = tmpUserVieweds[0];
            for (let j = 0; j < tmpUserVieweds.length; j++) {
              if (tmpUserVieweds[j].done || tmpUserVieweds[j].doneAt) {
                if (!tmpUserVieweds[j].doneAt && tmpUserVieweds[j].done) {
                  tmpUserVieweds[j].doneAt = new Date(
                    new Date(tmpUserVieweds[j].createdAt).setSeconds(
                      tmpUserVieweds[j].duration
                    )
                  );
                }
                tmpUserVieweds[j].done = true;
                tmpUserViewed = tmpUserVieweds[j];
                break;
              }
            }

            newUserVieweds.push(tmpUserViewed);
          }
        }
      }

      const userViewedDetails = [];

      newUserVieweds.forEach((userViewed) => {
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
