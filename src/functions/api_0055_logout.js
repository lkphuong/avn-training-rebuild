const { app } = require("@azure/functions");
const { StatusCodes } = require("http-status-codes");
const { MongoClient } = require("mongodb");
const { CONNECTION_STRING, COLLECTION, DB_NAME } = require("../../config");

const client = new MongoClient(CONNECTION_STRING);

const { success } = require("../../utils");

const { HEADERS } = require("../../constant/header");
const { AZURE_CONFIG } = require("../../config");

app.http("api_0055_logout", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "auth/azure/logout",
  handler: async (request, context) => {
    try {
      context.log(`Http function processed request for url "${request.url}"`);

      await client.connect();
      const database = client.db(DB_NAME);
      const azureConfigCollection = database.collection(
        COLLECTION.AZURE_CONFIG
      );

      const auzreConfigs = await azureConfigCollection.find().toArray();
      const tenant_id = auzreConfigs.find((item) => item.key == "tenant_id");

      console.log("data: ", auzreConfigs);

      return (context.res = {
        status: StatusCodes.OK,
        headers: HEADERS,
        body: success({
          uri: `https://login.microsoftonline.com/${
            tenant_id?.value ?? AZURE_CONFIG.AZURE_TENANT_ID
          }/oauth2/v2.0/logout?post_logout_redirect_uri=${
            AZURE_CONFIG.AZURE_REDIRECT_LOGIN_URI
          }`,
        }),
      });
    } catch (err) {
      console.log("err: ", e);
      return (context.res = {
        status: StatusCodes.BAD_REQUEST,
        body: success(null, "Đã có lỗi xảy ra vui lòng thử lại."),
        headers: HEADERS,
      });
    }
  },
});
