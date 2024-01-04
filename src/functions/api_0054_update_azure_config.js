const { app } = require("@azure/functions");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");

const { success, decodeJWT, authorization } = require("../../utils");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { HEADERS } = require("../../constant/header");
const { ROLE } = require("../../constant/role");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0054_update_azure_config", {
  methods: ["PUT"],
  authLevel: "anonymous",
  route: "azure-configs",
  handler: async (request, context) => {
    try {
      context.log(`Http function processed request for url "${request.url}"`);

      const token = request.headers.get("authorization");
      const decode = await decodeJWT(token);
      if (!decode) {
        return (context.res = {
          status: StatusCodes.UNAUTHORIZED,
          body: success(null, "Vui lòng đăng nhập trước khi gọi request."),
          headers: HEADERS,
        });
      }

      if (!authorization(decode, ROLE.IT)) {
        return (context.res = {
          status: StatusCodes.FORBIDDEN,
          body: success(null, "Không có quyền gọi request."),
          headers: HEADERS,
        });
      }

      await client.connect();
      const database = client.db(DB_NAME);
      const collection = database.collection(COLLECTION.AZURE_CONFIG);

      const data = await request.json();

      await Promise.all([
        collection.findOneAndUpdate(
          { key: "tenant_id" },
          {
            $set: {
              value: data.tenant_id,
            },
          }
        ),
        collection.findOneAndUpdate(
          { key: "client_secret" },
          { $set: { value: data.client_secret } }
        ),
        collection.findOneAndUpdate(
          { key: "client_id" },
          { $set: { value: data.client_id } }
        ),
      ]);

      return (context.res = {
        status: StatusCodes.OK,
        body: success("success", "Cập nhật thành công."),
        headers: HEADERS,
      });
    } catch (e) {
      console.log("err: ", e);
      return (context.res = {
        status: StatusCodes.BAD_REQUEST,
        body: success(null, "Đã có lỗi xảy ra vui lòng thử lại."),
        headers: HEADERS,
      });
    }
  },
});
