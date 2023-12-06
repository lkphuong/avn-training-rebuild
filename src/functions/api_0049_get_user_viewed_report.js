const { app } = require("@azure/functions");
const moment = require("moment");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");

const { success } = require("../../utils");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { HEADERS } = require("../../constant/header");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0049_get_user_viewed_report", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "post-users/getUserViewedReport",
  handler: async (request, context) => {
    try {
      context.log(`Http function processed request for url "${request.url}"`);

      await client.connect();
      const database = client.db(DB_NAME);
      const collection = database.collection(COLLECTION.POST_USER);

      const today = moment().startOf("day").toDate();
      const tomorrow = moment().add(1, "day").startOf("day").toDate();
      const yesterday = moment().subtract(1, "day").startOf("day").toDate();

      const thisWeekRequest = [];
      const lastWeekRequest = [];

      const thisWeekRequestDone = [];
      const lastWeekRequestDone = [];

      for (let i = 0; i < MAX_DAY_OF_WEEK; i++) {
        const dateInThisWeek = moment()
          .startOf("week")
          .add(i + 1, "day")
          .toDate();

        const nextDateInThisWeek = moment()
          .startOf("week")
          .add(i + 1, "day")
          .toDate();

        const dateInLastWeek = moment()
          .startOf("week")
          .subtract(6 - i, "day")
          .toDate();

        const nextDateInLastWeek = moment()
          .startOf("week")
          .subtract(6 - i, "day")
          .toDate();

        thisWeekRequest.push(
          collection.countDocuments({
            createdAt: {
              $gte: dateInThisWeek,
              $lt: nextDateInThisWeek,
            },
          })
        );
        lastWeekRequest.push(
          collection.countDocuments({
            createdAt: {
              $gte: dateInLastWeek,
              $lt: nextDateInLastWeek,
            },
          })
        );

        thisWeekRequestDone.push(
          collection.countDocuments({
            $or: [
              {
                createdAt: {
                  $gte: dateInThisWeek,
                  $lt: nextDateInThisWeek,
                },
                done: true,
              },
              {
                updatedAt: {
                  $gte: dateInThisWeek,
                  $lt: nextDateInThisWeek,
                },
                done: true,
              },
            ],
          })
        );
        lastWeekRequestDone.push(
          collection.countDocuments({
            $or: [
              {
                createdAt: {
                  $gte: dateInLastWeek,
                  $lt: nextDateInLastWeek,
                },
                done: true,
              },
              {
                updatedAt: {
                  $gte: dateInLastWeek,
                  $lt: nextDateInLastWeek,
                },
                done: true,
              },
            ],
          })
        );
      }

      const getTotalUserViewedToday = collection.countDocuments({
        createdAt: { $gte: today, $lte: tomorrow },
      });

      const getTotalUserViewedYesterday = collection.countDocuments({
        createdAt: { $gte: yesterday, $lte: today },
      });

      const getTotalUserViewedDoneToday = collection.countDocuments({
        $or: [
          {
            createdAt: { $gte: today, $lte: tomorrow },
            done: true,
          },
          {
            updatedAt: { $gte: today, $lte: tomorrow },
            done: true,
          },
        ],
      });

      const getTotalUserViewedDoneYesterday = collection.countDocuments({
        $or: [
          {
            createdAt: { $gte: yesterday, $lte: today },
            done: true,
          },
          {
            updatedAt: { $gte: yesterday, $lte: today },
            done: true,
          },
        ],
      });

      const reports = await Promise.all([
        ...thisWeekRequest,
        ...lastWeekRequest,
        getTotalUserViewedToday,
        getTotalUserViewedYesterday,
        ...thisWeekRequestDone,
        ...lastWeekRequestDone,
        getTotalUserViewedDoneToday,
        getTotalUserViewedDoneYesterday,
      ]);

      const dataReturn = {
        countThisWeek: reports.slice(0, 7),
        countLastWeek: reports.slice(7, 14),
        countToday: reports[14],
        countYesterday: reports[15],
        countDoneThisWeek: reports.slice(16, 23),
        countDoneLastWeek: reports.slice(23, 30),
        countDoneToday: reports[30],
        countDoneYesterday: reports[31],
      };

      return (context.res = {
        status: StatusCodes.OK,
        body: success(
          {
            data: dataReturn,
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
