const findUserViewedByPost = async (
  postId,
  query,
  collection,
  accountCollection
) => {
  let countVieweds = 0,
    userViewedFormateds = [];

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

    return {
      data: userViewedFormateds,
      total: countVieweds,
    };
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

    return {
      data: userViewedFormateds,
      total: countVieweds,
    };
  }
};
