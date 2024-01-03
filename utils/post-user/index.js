const { ObjectId } = require("mongodb");
const { DEFAULT_MAX_ITEM_PER_PAGE } = require("../../constant/setting");
const { SORT_BY } = require("../../constant/sort_by");
const { SORT_TYPE } = require("../../constant/sort_type");

const findUserViewedByPost = async (
  postId,
  query,
  postUserCollection,
  accountCollection
) => {
  let countVieweds = 0,
    userViewedFormateds = [];
  const searchObj = {};
  console.log("query", query);
  if (query) {
    const limit = query.get("limit") || DEFAULT_MAX_ITEM_PER_PAGE;
    const page = query.get("page") || 1;
    const offset = (page - 1) * limit;
    let sortBy = query.sortBy || "-" + SORT_BY.CREATED_AT;

    if (query.sortType === SORT_TYPE.ASC) {
      sortBy = query.sortBy;
    }

    if (query.get("done")) {
      searchObj.done = query.get("done") === "true" ? true : false;
    }
    console.log("searchObj", { ...searchObj, postId: new ObjectId(postId) });
    const userVieweds = await postUserCollection
      .find({ ...searchObj, postId: new ObjectId(postId) })
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

    userViewedFormateds = userVieweds.map((userViewed) => {
      const account = accounts.find(
        (a) => a._id.toString() == userViewed.accountId.toString()
      );
      return {
        ...userViewed,
        ...account,
        account: account,
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

    const accounts = await accountCollection.find({
      _id: { $in: accountIds },
    });

    userViewedFormateds = userVieweds.map((userViewed) => {
      const account = accounts.find((a) => a._id == userViewed.accountId);
      return {
        ...userViewed,
        account: account,
      };
    });

    return {
      data: userViewedFormateds,
      total: countVieweds,
    };
  }
};

module.exports = { findUserViewedByPost };
