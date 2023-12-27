const { app } = require("@azure/functions");
const {
  BlobServiceClient,
  StorageSharedKeyCredential,
} = require("@azure/storage-blob");
const { STORAGE_ACCOUNT } = require("../../config");
const { MongoClient, ObjectId } = require("mongodb");
const { StatusCodes } = require("http-status-codes");

const { success, decodeJWT, authorization } = require("../../utils");

const { CONNECTION_STRING, DB_NAME, COLLECTION } = require("../../config");
const { HEADERS } = require("../../constant/header");
const { ROLE } = require("../../constant/role");

const client = new MongoClient(CONNECTION_STRING);

app.http("api_0050_upload", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "files/upload",
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

    const storageCredentials = new StorageSharedKeyCredential(
      STORAGE_ACCOUNT.ACCOUNT_NAME,
      STORAGE_ACCOUNT.ACCOUNT_KEY
    );
    const blobServiceClient = new BlobServiceClient(
      `https://${STORAGE_ACCOUNT.ACCOUNT_NAME}.blob.core.windows.net`,
      storageCredentials
    );
    const containerClient = blobServiceClient.getContainerClient(
      STORAGE_ACCOUNT.CONTAINER_NAME
    );

    try {
      const reader = await request.formData();

      const file = reader.get("file");
      const sourceType = reader.get("sourceType");

      const fileContentBuffer = await reader.get("file").arrayBuffer();

      const fileName = Date.now() + "-" + file.name;

      const blockBlobClient = containerClient.getBlockBlobClient(fileName);
      const result = await blockBlobClient.upload(
        fileContentBuffer,
        file.size,
        {
          blobHTTPHeaders: { blobContentType: file.type },
        }
      );

      await client.connect();
      const database = client.db(DB_NAME);
      const collection = database.collection(COLLECTION.FILE);

      const _id = new ObjectId();
      await collection.insertOne({
        _id,
        deleted: false,
        path: STORAGE_ACCOUNT.URL + fileName,
        thumbnail: STORAGE_ACCOUNT.URL,
        sourceType: sourceType,
      });

      return (context.res = {
        status: StatusCodes.OK,
        body: success({ _id, path: STORAGE_ACCOUNT.URL + fileName }, null),
        headers: HEADERS,
      });
    } catch (error) {
      console.log("error");
      return (context.res = {
        status: StatusCodes.BAD_REQUEST,
        body: success(null, "Đã có lỗi xảy ra vui lòng thử lại."),
        headers: HEADERS,
      });
    }
  },
});
