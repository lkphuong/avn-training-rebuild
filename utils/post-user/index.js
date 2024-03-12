const { ObjectId } = require("mongodb");
const { DEFAULT_MAX_ITEM_PER_PAGE } = require("../../constant/setting");
const { SORT_BY } = require("../../constant/sort_by");
const { SORT_TYPE } = require("../../constant/sort_type");

const findUserViewedByPost = async (
  postId,
  query,
  postUserCollection,
  accountCollection,
  userCollection
) => {
  let countVieweds = 0,
    userViewedFormateds = [];
  const searchObj = {};
  if (query) {
    const limit = query.get("limit") || DEFAULT_MAX_ITEM_PER_PAGE;
    const page = query.get("page") || 1;
    const offset = (page - 1) * limit;

    const sort = query.get("sortType") === SORT_TYPE.ASC ? 1 : -1;

    if (query.get("done")) {
      searchObj.done = query.get("done") === "true" ? true : false;
    }

    const userVieweds = await postUserCollection
      .find({ ...searchObj, postId: new ObjectId(postId) })
      .sort({ createdAt: sort })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .toArray();

    countVieweds = await postUserCollection.countDocuments({
      ...searchObj,
      postId: new ObjectId(postId),
    });

    const accountIds = userVieweds.map((e) => e.accountId);
    const accounts = await accountCollection
      .find({
        _id: { $in: accountIds },
      })
      .toArray();

    const userIds = accounts.map((e) => e.userId);
    const users = await userCollection
      .find({
        _id: { $in: userIds },
      })
      .toArray();

    userViewedFormateds = userVieweds.map((userViewed) => {
      const account = accounts.find(
        (a) => a._id.toString() == userViewed?.accountId.toString()
      );

      const user = users.find(
        (u) => u._id.toString() == account?.userId.toString()
      );

      if (account) {
        delete account.createdAt;
      }
      if (user) {
        delete account.createdAt;
      }

      return {
        ...userViewed,
        ...account,
        ...user,
        createdAt: userViewed.createdAt,
      };
    });
    return {
      data: userViewedFormateds,
      total: countVieweds,
    };
  } else {
    const userVieweds = await postUserCollection
      .find({ postId: new ObjectId(postId) })
      .toArray();
    countVieweds = await postUserCollection.countDocuments({
      postId: new ObjectId(postId),
    });

    const accountIds = userVieweds.map((e) => e.accountId);

    const accounts = await accountCollection
      .find({
        _id: { $in: accountIds },
      })
      .toArray();

    const userIds = accounts.map((e) => e.userId);
    const users = await userCollection
      .find({
        _id: { $in: userIds },
      })
      .toArray();

    userViewedFormateds = userVieweds.map((userViewed) => {
      const account = accounts.find(
        (a) => a._id.toString() == userViewed?.accountId?.toString()
      );
      const user = users.find(
        (u) => u._id.toString() == account?.userId?.toString()
      );
      return {
        ...userViewed,
        ...account,
        ...user,
        createdAt: userViewed.createdAt,
      };
    });

    return {
      data: userViewedFormateds,
      total: countVieweds,
    };
  }
};

module.exports = { findUserViewedByPost };
