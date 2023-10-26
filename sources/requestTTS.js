//TTS 영역

const textToSpeech = require("@google-cloud/text-to-speech");
const fs = require("fs");
const util = require("util");

const client2 = new textToSpeech.TextToSpeechClient();
/**
 * TTS 요청을 생성하고 output폴더에 출력물을 생성
 * @param {gpt에서 나온 출력이 들어갈 자리} inputString
 */
module.exports = async function requestTTS(inputString) {
  const text = inputString;

  // 리퀘스트 구성
  const request = {
    input: { text: text },
    // 언어 타입 및 언어 성별 선택
    voice: { languageCode: "ko-KR", ssmlGender: "FEMALE" },
    // 오디오 인코딩 선택
    audioConfig: { audioEncoding: "MP3" },
  };

  // 요청 수행
  const [response] = await client2.synthesizeSpeech(request);
  // 로컬파일에 바이너리파일 기록
  const writeFile = util.promisify(fs.writeFile);
  await writeFile("./output/output.mp3", response.audioContent, "binary");
};
