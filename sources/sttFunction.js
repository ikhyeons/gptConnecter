// Google_Cloud 음성 라이브러리를 들고옴
const speech = require("@google-cloud/speech");
const client = new speech.SpeechClient();

/**
 *@param {'구글 클라우드 파일의 원격 경로'} gcsUri
 * @returns {'STT후 나온 텍스트'}
 */
module.exports = sttFunction = async (fileName = "기본.mp3") => {
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
  return transcription[0].transcript;
};
