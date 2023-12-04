const { app } = require("@azure/functions");
const { StatusCodes } = require("http-status-codes");
const { success, decodeJWT } = require("../../utils");
const { HEADERS } = require("../../constant/header");

app.http("api_0031_get_profile", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "auth/profile",
  handler: async (request, context) => {
    context.log(`Http function processed request for url "${request.url}"`);

    const token = request.headers.get("authorization");
    const decode = await decodeJWT(token);
    if (!decode) {
      return (context.res = {
        status: StatusCodes.BAD_REQUEST,
        body: success(null, null, "Vui lòng đăng nhập trước khi gọi request."),
        headers: HEADERS,
      });
    }

    return (context.res = {
      status: StatusCodes.OK,
      body: success(decode, null, null),
      headers: HEADERS,
    });
  },
});
