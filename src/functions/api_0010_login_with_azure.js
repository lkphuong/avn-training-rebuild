const { app } = require("@azure/functions");
const { StatusCodes } = require("http-status-codes");
const { MongoClient, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const {
  CONNECTION_STRING,
  COLLECTION,
  DB_NAME,
  GROUP_VALUES,
  JWT_KEY,
} = require("../../config");

const axios = require("axios");
const client = new MongoClient(CONNECTION_STRING);

const { success } = require("../../utils");

const { HEADERS } = require("../../constant/header");
const { AZURE_CONFIG } = require("../../config");

app.http("api_0010_login_with_azure", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "auth/azure/login",
  handler: async (request, context) => {
    context.log(`Http function processed request for url "${request.url}"`);

    const data = await request.json();

    const { code } = data;
    const urlData = new URLSearchParams({
      client_id: AZURE_CONFIG.AZURE_CLIENT_ID,
      scope: "user.read",
      redirect_uri: AZURE_CONFIG.AZURE_REDIRECT_URI,
      grant_type: "authorization_code",
      client_secret: AZURE_CONFIG.AZURE_CLIENT_SECRET,
      code: code,
    });

    // generate token
    const token = await axios
      .post(
        `https://login.microsoftonline.com/${AZURE_CONFIG.AZURE_TENANT_ID}/oauth2/v2.0/token`,
        urlData
      )
      .then((r) => {
        return { access_token: r.data.access_token };
      })
      .catch(() => {
        return (context.res = {
          status: StatusCodes.BAD_REQUEST,
          body: success(null, "invalid_grant"),
          headers: HEADERS,
        });
      });

    if (!token?.access_token) {
      return (context.res = {
        status: StatusCodes.BAD_REQUEST,
        body: success(null, "invalid_grant"),
        headers: HEADERS,
      });
    }

    const getProfile = await axios
      .get(`https://graph.microsoft.com/v1.0/me`, {
        params: {
          $select: `id,birthday,department,displayName,mobilePhone,mail,jobTitle,aboutMe`,
        },
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
      })
      .then((r) => {
        return { access_token: r.data };
      })
      .catch((e) => {
        console.log("Err: ", e.message);
        return (context.res = {
          status: StatusCodes.BAD_REQUEST,
          body: success(null, "invalid_grant"),
          headers: HEADERS,
        });
      });

    // check info in database
    await client.connect();
    const database = client.db(DB_NAME);
    const accountCollection = database.collection(COLLECTION.ACCOUNT);
    const userCollection = database.collection(COLLECTION.USERS);
    const userGroupCollection = database.collection(COLLECTION.USER_GROUP);
    const groupCollection = database.collection(COLLECTION.GROUP);

    const account = await accountCollection.findOne({
      username: getProfile?.access_token?.id,
    });
    if (account) {
      // gen jwt token
      const group = await groupCollection.findOne({
        _id: new ObjectId(account.groupId),
      });
      const accessToken = jwt.sign(
        {
          _id: account._id,
          username: account.username,
          name: account.name,
          avatar: account?.avatar ?? "",
          lang: group?.name == "admin" ? ["vi", "en"] : ["vi"],
          group: group?.name == "admin" ? "admin" : "user",
        },
        JWT_KEY,
        {
          expiresIn: 60 * 60 * 24,
        }
      );

      return (context.res = {
        status: StatusCodes.OK,
        body: success({ accessToken }, null),
        headers: HEADERS,
      });
    } else {
      const newUserID = new ObjectId();
      const newAccountID = new ObjectId();

      const newInfo = await Promise.all([
        userCollection.insertOne({
          _id: newUserID,
          department: getProfile?.access_token?.department ?? null,
          unit: "",
          section: "",
          position: getProfile?.access_token?.jobTitle ?? null,
          lang: "vi",
        }),
        accountCollection.insertOne({
          _id: newAccountID,
          username: getProfile?.access_token?.id ?? "",
          name: getProfile?.access_token?.displayName ?? "",
          birthday: getProfile?.access_token?.birthday,
          email: getProfile?.access_token?.mail ?? "",
          phoneNumber: getProfile?.access_token?.mobilePhone ?? "",
          userId: newUserID,
        }),
        userGroupCollection.insertOne({
          _id: new ObjectId(),
          userId: newUserID,
          groupId: new ObjectId(GROUP_VALUES.GROUP_USER),
        }),
      ]);

      // gen jwt token
      const accessToken = jwt.sign(
        {
          username: account.username,
          name: account.name,
          avatar: account?.avatar ?? "",
          lang: group?.name == "admin" ? ["vi", "en"] : ["vi"],
          group: group?.name == "admin" ? "admin" : "user",
        },
        JWT_KEY,
        {
          expiresIn: 60 * 60 * 24,
        }
      );

      return (context.res = {
        status: StatusCodes.OK,
        body: success({ accessToken }, null),
        headers: HEADERS,
      });
    }
  },
});
