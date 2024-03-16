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
    try {
      context.log(`Http function processed request for url "${request.url}"`);

      const data = await request.json();

      // check info in database
      await client.connect();
      const database = client.db(DB_NAME);
      const accountCollection = database.collection(COLLECTION.ACCOUNT);
      const userCollection = database.collection(COLLECTION.USERS);
      const userGroupCollection = database.collection(COLLECTION.USER_GROUP);
      const groupCollection = database.collection(COLLECTION.GROUP);
      const azureConfigCollection = database.collection(
        COLLECTION.AZURE_CONFIG
      );

      const auzreConfigs = await azureConfigCollection.find().toArray();
      const tenant_id = auzreConfigs.find((item) => item.key == "tenant_id");
      const client_secret = auzreConfigs.find(
        (item) => item.key == "client_secret"
      );
      const client_id = auzreConfigs.find((item) => item.key == "client_id");

      console.log("data: ", tenant_id, client_secret, client_id);

      const { code } = data;
      const urlData = new URLSearchParams({
        client_id: client_id.value ?? AZURE_CONFIG.AZURE_CLIENT_ID,
        scope: "user.read",
        redirect_uri: AZURE_CONFIG.AZURE_REDIRECT_URI,
        grant_type: "authorization_code",
        client_secret: client_secret.value ?? AZURE_CONFIG.AZURE_CLIENT_SECRET,
        code: code,
      });

      // generate token
      const token = await axios
        .post(
          `https://login.microsoftonline.com/${
            tenant_id.value ?? AZURE_CONFIG.AZURE_TENANT_ID
          }/oauth2/v2.0/token`,
          urlData
        )
        .then((r) => {
          return { access_token: r.data.access_token };
        })
        .catch(() => {
          return (context.res = {
            status: StatusCodes.BAD_REQUEST,
            body: success(null, "invalid_grant 1"),
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
            $select: `id,birthday,department,displayName,mobilePhone,mail,jobTitle,aboutMe,employeeId, userPrincipalName, gender`,
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

      let account = await accountCollection.findOne({
        username: getProfile?.access_token?.employeeId,
      });

      if (!account) {
        account = await accountCollection.findOne({
          email: getProfile?.access_token?.userPrincipalName,
        });
      }

      if (account) {
        if (!account.active) {
          return (context.res = {
            status: StatusCodes.NOT_FOUND,
            body: success(
              null,
              "Người dùng không tồn tại" + account._id + account.active
            ),
            headers: HEADERS,
          });
        }

        const [userGroup, user] = await Promise.all([
          userGroupCollection.findOne({
            userId: account?.userId,
          }),
          userCollection.findOne({ _id: account.userId }),
        ]);

        // gen jwt token
        const group = await groupCollection.findOne({
          _id: new ObjectId(userGroup?.groupId),
        });

        //#region update info
        await Promise.all([
          userCollection.findOneAndUpdate(
            { _id: account.userId },
            {
              $set: {
                department: getProfile?.access_token?.department ?? null,
                position: getProfile?.access_token?.jobTitle ?? null,
                section: getProfile?.access_token?.section ?? null,
              },
            }
          ),
          accountCollection.findOneAndUpdate(
            { _id: account._id },
            {
              $set: {
                email: getProfile?.access_token?.mail ?? account?.email ?? "",
                name: getProfile?.access_token?.displayName ?? "",
                birthday: getProfile?.access_token?.birthday,
                phoneNumber: getProfile?.access_token?.mobilePhone ?? "",
                gender: getProfile?.access_token?.gender ?? false,
              },
            }
          ),
        ]);
        //#endregion
        const accessToken = jwt.sign(
          {
            _id: account._id,
            username: account.username,
            token_id: account?.token_id,
            name: getProfile?.access_token?.displayName,
            avatar: account?.avatar ?? "",
            userId: account?.userId,
            lang:
              group?.name == "admin" || group?.name == "it"
                ? ["vi", "en"]
                : [user?.lang ?? "vi"],
            group: group?.name ?? "user",
          },
          JWT_KEY,
          {
            expiresIn: "30d",
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

        await Promise.all([
          userCollection.insertOne({
            _id: newUserID,
            department: getProfile?.access_token?.department ?? null,
            unit: "",
            section: getProfile?.access_token?.section ?? null,
            position: getProfile?.access_token?.jobTitle ?? null,
            lang: "vi",
            deleted: false,
            createdAt: new Date(),
          }),
          accountCollection.insertOne({
            _id: newAccountID,
            username: getProfile?.access_token?.employeeId ?? "",
            token_id: getProfile?.access_token?.id ?? "",
            name: getProfile?.access_token?.displayName ?? "",
            birthday: getProfile?.access_token?.birthday,
            email:
              getProfile?.access_token?.mail ??
              getProfile.access_token?.userPrincipalName, // mail
            phoneNumber: getProfile?.access_token?.mobilePhone ?? "",
            gender: getProfile?.access_token?.gender,
            active: true,
            userId: newUserID,
            deleted: false,
            createdAt: new Date(),
            access_token: getProfile.access_token,
            lang: "vi",
          }),
          userGroupCollection.insertOne({
            _id: new ObjectId(),
            userId: newUserID,
            groupId: new ObjectId(GROUP_VALUES.GROUP_USER),
            deleted: false,
            createdAt: new Date(),
          }),
        ]);

        // gen jwt token
        const accessToken = jwt.sign(
          {
            _id: newAccountID,
            username: getProfile?.access_token?.employeeId ?? "",
            name: getProfile?.access_token?.displayName ?? "",
            avatar: "",
            lang: ["vi"],
            group: "user",
            userId: newUserID,
          },
          JWT_KEY,
          {
            expiresIn: "30d",
          }
        );

        return (context.res = {
          status: StatusCodes.OK,
          body: success({ accessToken }, null),
          headers: HEADERS,
        });
      }
    } catch (err) {
      return (context.res = {
        status: StatusCodes.OK,
        body: success({ data: err }, null),
        headers: HEADERS,
      });
    }
  },
});
