const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");

const { success, decodeJWT } = require("../../utils");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { HEADERS } = require("../../constant/header");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0048_post_user_update_done_status", {
  methods: ["PUT"],
  authLevel: "anonymous",
  route: "post-users/updateDoneStatus/{postId}",
  handler: async (request, context) => {
    try {
      context.log(`Http function processed request for url "${request.url}"`);

      const postId = request.params.postId;
      const data = await request.json();
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
      const collection = database.collection(COLLECTION.POST_USER);

      const postView = await collection.findOne({
        accountId: new ObjectId(decode._id),
        postId: new ObjectId(postId),
      });

      console.log("postView: ", postView);

      if (!postView) {
        const _id = new ObjectId();
        await collection.insertOne({
          _id: _id,
          accountId: new ObjectId(decode._id),
          postId: new ObjectId(postId),
          done: data?.done ?? false,
          duration: data?.duration ?? 0,
          deleted: false,
          createdAt: new Date(),
        });

        return (context.res = {
          status: StatusCodes.OK,
          body: success(
            {
              _id,
            },
            null
          ),
          headers: HEADERS,
        });
      } else {
        if (data?.done) {
          postView.done = data.done;
          postView.doneAt = new Date(Date.now());
        }

        if (data.duration) {
          postView.duration = data.duration;
        }
        const _id = postView._id;
        if (postView._id) {
          delete postView._id;
          delete postView.createdAt;
        }

        console.log("postView 2: ", postView);

        await collection.findOneAndUpdate(
          { accountId: new ObjectId(decode._id), postId: new ObjectId(postId) },
          { $set: { ...postView } }
        );

        return (context.res = {
          status: StatusCodes.OK,
          body: success(
            {
              _id,
            },
            null
          ),
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
