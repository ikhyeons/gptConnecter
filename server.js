const requestTTS = require("./sources/requestTTS");
const sendMP3F = require("./sources/sendMP3F");
const sttFunction = require("./sources/sttFunction");
const gptResponse = require("./sources/gptResponse");
//gptAPI Key

//Server 설정
const express = require("express");
const app = express();
const port = 2000;
app.use(express.json());
app.listen(port, () => {
  console.log(`server run in ${port}`);
});

//multer 구글 클라우드 설정

const Multer = require("multer");

const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 30 * 1024 * 1024, // no larger than 5mb, you can change as needed.
  },
});

//실제 api 구동 부
app.post("/", multer.single("file"), async (req, res) => {
  //req에서 받은 파일을 클라우드에 저장
  const fileName = await sendMP3F(req);
  setTimeout(async () => {
    // 클라우드에 저장된 파일을 바로 못불러와서 1초 정도만 기다리기
    const STTData = await sttFunction(fileName); // 클라우드에서 STT데이터를 받아옴
    if (!STTData) {
      console.log("no description");
      res.send({ result: 0 });
    } else {
      console.log("받은 STT : " + STTData);
      const returnFromGPT = await gptResponse(STTData + "? 짧게 대답해줘"); // STT데이터로 GPT에 요청하여 GPT응답을 받음
      console.log("응답 : " + returnFromGPT);
      // 받아온 텍스트로 TTS 요청 및 file 생성
      await requestTTS(returnFromGPT);
      res.sendFile(
        "C:/Users/skant/OneDrive/Desktop/Projects/gptConnecter(졸작)/output/output.mp3"
      );
    }
  }, 1000);
});

//gpt만 사용하기
app.get("/gptOnly", async (req, res) => {
  const text = res.body.order;
  const returnFromGPT = await gptResponse(text + "? 짧은 길이로 대답해줘"); // STT데이터로 GPT에 요청하여 GPT응답을 받음
  console.log("응답 : " + returnFromGPT);
  res.send(returnFromGPT);
});
