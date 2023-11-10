// const { app } = require("@azure/functions");
// const { randomUUID } = require("crypto");
// const { hash } = require("bcrypt");
// const {
//   CryptoProvider,
//   ConfidentialClientApplication,
// } = require("@azure/msal-node");

// const { success } = require("../../utils");

// const { validateRedirectUri } = require("../../validations/auzre_redirect_uri");

// const { HEADERS } = require("../../constant/header");
// const { AZURE_CONFIG } = require("../../config");
// const { StatusCodes } = require("http-status-codes");

// const provider = new CryptoProvider();
// const msalConfig = {
//   auth: {
//     clientId: AZURE_CONFIG.AZURE_CLIENT_ID,
//     authority: `https://login.microsoftonline.com/${AZURE_CONFIG.AZURE_TENANT_ID}`,
//     clientSecret: AZURE_CONFIG.AZURE_CLIENT_SECRET,
//   },
// };
// const instance = new ConfidentialClientApplication(msalConfig);

// app.http("api_0011_redirect_azure", {
//   methods: ["POST"],
//   authLevel: "anonymous",
//   route: "auth/azure/redirect",
//   handler: async (request, context) => {
//     context.log(`Http function processed request for url "${request.url}"`);
//     const data = await request.json();
//     const redirectUri = data.redirectUri;
//     const validationErrors = validateRedirectUri(data);

//     if (validationErrors.length > 0) {
//       return (context.res = {
//         status: StatusCodes.BAD_REQUEST,
//         body: success(null, null, validationErrors),
//         headers: HEADERS,
//       });
//     }

//     const csrfToken = randomUUID();
//     const token = await hash(csrfToken, 10);

//     const { challenge, verifier } = await provider.generatePkceCodes();

//     const state = Buffer.from(
//       JSON.stringify({ csrfToken, redirectUri })
//     ).toString("base64");

//     const authUrlRequest = {
//       redirectUri,
//       responseMode: "query",
//       codeChallenge: challenge,
//       codeChallengeMethod: "S256",
//       state,
//       scopes: ["User.Read"],
//     };

//     const url = await instance.getAuthCodeUrl(authUrlRequest);

//     return (context.res = {
//       status: StatusCodes.OK,
//       body: success({ url, csrfToken: token, verifier }, null),
//       headers: HEADERS,
//       cookies: [
//         {
//           name: "codeVerifier",
//           value: verifier,
//           maxAge: 5 * 60 * 1000,
//         },
//         {
//           name: "csrfToken",
//           value: token,
//           maxAge: 5 * 60 * 1000,
//         },
//       ],
//     });
//   },
// });
