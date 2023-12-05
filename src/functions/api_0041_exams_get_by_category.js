const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");

const { success } = require("../../utils");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { HEADERS } = require("../../constant/header");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0041_exams_get_by_category", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "exams/getByCategory/{categoryId}",
  handler: async (request, context) => {
    try {
      context.log(`Http function processed request for url "${request.url}"`);

      const categoryId = request.params.categoryId;

      await client.connect();
      const database = client.db(DB_NAME);
      const collection = database.collection(COLLECTION.EXAM);
      const postCollection = database.collection(COLLECTION.POST);

      const testDetailByCategory = await collection.findOne({
        sourceId: new ObjectId(categoryId),
        sourceType: 1,
      });

      if (testDetailByCategory) {
        const countPostExist = await postCollection.countDocuments({
          delete: false,
          categoryId: categoryId,
        });

        return (context.res = {
          status: StatusCodes.OK,
          body: success(
            {
              isExist: true,
              data: {
                totalPost: countPostExist,
                ...testDetailByCategory,
              },
            },
            null
          ),
          headers: HEADERS,
        });
      } else {
        const postsByCategory = await postCollection
          .find({
            categoryId: categoryId,
            deleted: false,
          })
          .toArray();

        if (!postsByCategory?.length) {
          return (context.res = {
            status: StatusCodes.OK,
            body: success(
              {
                isExist: false,
              },
              null
            ),
            headers: HEADERS,
          });
        }

        const postIds = postsByCategory.map((post) => post._id);

        const examByPosts = await collection
          .find({
            sourceId: { $in: postIds },
          })
          .toArray();

        const countPostExist = await postCollection.countDocuments({
          deleted: false,
          categoryId: categoryId,
        });

        if (!examByPosts?.length) {
          return (context.res = {
            status: StatusCodes.OK,
            body: success(
              {
                isExist: false,
              },
              null
            ),
            headers: HEADERS,
          });
        } else {
          return (context.res = {
            status: StatusCodes.OK,
            body: success(
              {
                isExist: true,
                type: 0, // post
                data: {
                  totalPost: countPostExist,
                },
              },
              null
            ),
            headers: HEADERS,
          });
        }
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
