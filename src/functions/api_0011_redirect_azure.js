const { app } = require("@azure/functions");
const { StatusCodes } = require("http-status-codes");
const { MongoClient } = require("mongodb");
const { success } = require("../../utils");

const { CONNECTION_STRING, COLLECTION, DB_NAME } = require("../../config");

const { validateRedirectUri } = require("../../validations/auzre_redirect_uri");

const { HEADERS } = require("../../constant/header");
const { AZURE_CONFIG } = require("../../config");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0011_redirect_azure", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "auth/azure/redirect",
  handler: async (request, context) => {
    context.log(`Http function processed request for url "${request.url}"`);
    const data = await request.json();
    const redirectUri = data.redirectUri;
    const validationErrors = validateRedirectUri(data);

    if (validationErrors.length > 0) {
      return (context.res = {
        status: StatusCodes.BAD_REQUEST,
        body: success(null, null, validationErrors),
        headers: HEADERS,
      });
    }

    await client.connect();
    const database = client.db(DB_NAME);
    const azureConfigCollection = database.collection(COLLECTION.AZURE_CONFIG);

    const auzreConfigs = await azureConfigCollection.find().toArray();
    const tenant_id = auzreConfigs.find((item) => item.key == "tenant_id");
    const client_id = auzreConfigs.find((item) => item.key == "client_id");

    console.log("data: ", auzreConfigs);

    const url = `https://login.microsoftonline.com/${
      tenant_id?.value ?? AZURE_CONFIG.AZURE_TENANT_ID
    }/oauth2/v2.0/authorize?client_id=${
      client_id?.value ?? AZURE_CONFIG.AZURE_CLIENT_ID
    }&response_type=code&redirect_uri=${
      "https://stagingtraining.ajinomoto.com.vn/azureLogin" ?? // web lười qué phải đổi ở api :))
      AZURE_CONFIG.AZURE_REDIRECT_URI
    }&response_mode=query&scope=openid%20offline_access%20https%3A%2F%2Fgraph.microsoft.com%2Fuser.read`;

    return (context.res = {
      status: StatusCodes.OK,
      body: success({ url }, null),
      headers: HEADERS,
    });
  },
});
