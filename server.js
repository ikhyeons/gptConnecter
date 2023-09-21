//gptAPI Key
const gptKey = require("./apiKey.js");
//Server 설정
const express = require("express");
const app = express();
const port = 2000;
app.use(express.json());
app.listen(port, () => {
  console.log(`server run in ${port}`);
});

//multer 구글 클라우드 설정
const { format } = require("util");
const { Storage } = require("@google-cloud/storage");
const gStorage = new Storage();
const Multer = require("multer");

const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // no larger than 5mb, you can change as needed.
  },
});

const bucket = gStorage.bucket("ikhyeons");

//GPT Request 설정
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  organization: "org-3zrb4sS5xFw2byNjGGciHYYb",
  apiKey: gptKey,
});
const openai = new OpenAIApi(configuration);

// Google_Cloud 음성 라이브러리를 들고옴
const speech = require("@google-cloud/speech");
const client = new speech.SpeechClient();

//실제 api 구동 부
app.post("/", multer.single("file"), async (req, res) => {
  //req에서 받은 파일을 클라우드에 저장
  const fileName = await sendMP3F(req);
  setTimeout(async () => {
    // 클라우드에 저장된 파일을 바로 못불러와서 1초 정도만 기다리기
    const STTData = await STTFunction(fileName); // 클라우드에서 STT데이터를 받아옴
    console.log("받은 STT : " + STTData);
    const returnFromGPT = await GPTResponse(
      STTData + "? 적당한 길이로 대답해줘"
    ); // STT데이터로 GPT에 요청하여 GPT응답을 받음
    console.log("응답 : " + returnFromGPT);
    res.send(returnFromGPT);
  }, 1000);
});

/***********************함수 정의부****************************/

/**
 *
 * @param {*} req request요청 객체
 * @returns Google Cloud에 저장된 파일의 오리지널네임을 반납
 */
const sendMP3F = async (req) => {
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

/**
 *@param {'구글 클라우드 파일의 원격 경로'} gcsUri
 * @returns {'STT후 나온 텍스트'}
 */
const STTFunction = async (fileName = "기본.mp3") => {
  const audio = {
    // 오디오 파일의 경로
    uri: `gs://ikhyeons/${fileName}`,
  };
  const config = {
    //오디포 파일의 인코딩, 헤르츠 수, 언어코드
    encoding: "MP3",
    sampleRateHertz: 48000,
    languageCode: "ko-kr",
  };
  const request = {
    // 생성 리퀘스트 객체
    audio: audio,
    config: config,
  };

  // 오디오 파일을 탐지함
  const [response] = await client.recognize(request); // 요청에 대한 탐지 결과 반납

  // 탐지 결과
  let transcription = response.results.map((result) => result.alternatives[0]);
  console.log(transcription[0].transcript);
  return transcription[0].transcript;
};

/**
 *
 * @param {'GPT에 물어 볼 텍스트'} STTOutPut
 * @returns {'GPT에서 나온 답변을 텍스트화하여 출력'}
 */
const GPTResponse = async (STTOutPut) => {
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "assistant",
        content: STTOutPut,
      },
    ],
  });
  return response.data.choices[0].message.content;
};
