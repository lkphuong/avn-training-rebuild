// const { app } = require("@azure/functions");
// const {
//   CryptoProvider,
//   ConfidentialClientApplication,
// } = require("@azure/msal-node");

// const { decode } = require("../../utils");

// const { HEADERS } = require("../../constant/header");
// const { AZURE_CONFIG } = require("../../config");

// const provider = new CryptoProvider();
// const msalConfig = {
//   auth: {
//     clientId: AZURE_CONFIG.AZURE_CLIENT_ID,
//     authority: `https://login.microsoftonline.com/${AZURE_CONFIG.AZURE_TENANT_ID}`,
//     clientSecret: AZURE_CONFIG.AZURE_CLIENT_SECRET,
//   },
// };
// const instance = new ConfidentialClientApplication(msalConfig);

// app.http("api_0010_login_with_azure", {
//   methods: ["POST"],
//   authLevel: "anonymous",
//   route: "auth/azure/login",
//   handler: async (request, context) => {
//     context.log(`Http function processed request for url "${request.url}"`);

//     const data = await request.json();

//     const { codeVerifier, code } = data;

//     const state = decode(data.state);

//     const result = await instance.acquireTokenByCode({
//       code,
//       codeVerifier,
//       scopes: ["User.Read"],
//       redirectUri: state.redirectUri,
//     });

//     return { body: result };
//   },
// });
