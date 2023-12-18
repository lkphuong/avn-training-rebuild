const { app } = require("@azure/functions");
const redis = require("redis");
const { MongoClient } = require("mongodb");
const { StatusCodes } = require("http-status-codes");
const { success, decodeJWT, authorization } = require("../../utils");
const { ERROR_MESSAGE } = require("../../constant/error_message");
const {
  CONNECTION_STRING,
  DB_NAME,
  COLLECTION,
  AZURE_REDIS,
} = require("../../config");
const { HEADERS } = require("../../constant/header");
const { REDIS_KEY } = require("../../constant/redis_key");
const { ROLE } = require("../../constant/role");

const client = new MongoClient(CONNECTION_STRING);
const redisClient = redis.createClient({
  url: `rediss://${AZURE_REDIS.HOST_NAME}:6380`,
  password: AZURE_REDIS.PASSWORD,
});

app.http("api_0012_get_all_posts", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "posts",
  handler: async (request, context) => {
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

    if (!authorization(decode, ROLE.ADMIN)) {
      return (context.res = {
        status: StatusCodes.FORBIDDEN,
        body: success(null, "Không có quyền gọi request."),
        headers: HEADERS,
      });
    }

    await client.connect();
    // await redisClient.connect();

    // const result = await redisClient.get(REDIS_KEY.POST);
    // if (result) {
    //   redisClient.disconnect();
    //   return (context.res = {
    //     status: StatusCodes.OK,
    //     body: result,
    //     headers: HEADERS,
    //   });
    // }

    const database = client.db(DB_NAME);
    const collection = database.collection(COLLECTION.POST);
    const data = await collection.find({ deleted: false }).toArray();

    //await redisClient.set(REDIS_KEY.POST, success(data, null));
    //redisClient.disconnect();
    if (data?.length) {
      return (context.res = {
        status: StatusCodes.OK,
        body: success(data, null),
        headers: HEADERS,
      });
    }
    return (context.res = {
      status: StatusCodes.NOT_FOUND,
      body: success(data, ERROR_MESSAGE.NOT_FOUND),
      headers: HEADERS,
    });
  },
});
