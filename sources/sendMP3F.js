const { Storage } = require("@google-cloud/storage");
const gStorage = new Storage();
const bucket = gStorage.bucket("ikhyeons");
const { format } = require("util");

/**
 *
 * @param {*} req request요청 객체
 * @returns Google Cloud에 저장된 파일의 오리지널네임을 반납
 */
module.exports = sendMP3F = async (req) => {
  // 파일의 오리지널 네임을 받아서 스트림을 작성함
  const blob = await bucket.file(req.file.originalname);
  const blobStream = await blob.createWriteStream({
    resumable: false,
  });
  await blobStream.on("error", (err) => {
    throw err;
  });

  await blobStream.on("finish", () => {
    console.log(bucket.name, blob.name);
    // HTTP통신을 통해 publicURL로 파일에 바로 접속할 수 있음
    const publicUrl = format(
      `https://storage.googleapis.com/${bucket.name}/${blob.name}`
    );
  });

  await blobStream.end(req.file.buffer);
  return await blob.name;
};
