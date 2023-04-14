//gptAPI Key
const gptKey = require('./apiKey.js')
//Server 설정
const express = require('express')
const app = express()
const port = 2000
app.use(express.json())
app.listen(port, () => {
  console.log(`server run in ${port}`)
})

//GPT Request 설정
const { Configuration, OpenAIApi } = require('openai')
const configuration = new Configuration({
  organization: 'org-3zrb4sS5xFw2byNjGGciHYYb',
  apiKey: gptKey,
})
const openai = new OpenAIApi(configuration)

// Google_Cloud 음성 라이브러리를 들고옴
const speech = require('@google-cloud/speech')
const client = new speech.SpeechClient()

app.get('/', async (req, res) => {
  const STTData = await STTFunction() // STT데이터를 받아옴
  console.log('받은 STT : ' + STTData)
  const returnFromGPT = await GPTResponse(STTData) // STT데이터로 GPT에 요청하여 GPT응답을 받음
  console.log('응답 : ' + returnFromGPT)

  res.send(returnFromGPT)
})

/***********************함수 정의부****************************/

/**
 *
 * @param {'GPT에 물어 볼 텍스트'} STTOutPut
 * @returns {'GPT에서 나온 답변을 텍스트화하여 출력'}
 */
const GPTResponse = async (STTOutPut) => {
  const response = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'assistant',
        content: STTOutPut,
      },
    ],
  })
  return response.data.choices[0].message.content
}

/**
 *@param {'구글 클라우드 파일의 원격 경로'} gcsUri
 * @returns {'STT후 나온 텍스트'}
 */
const STTFunction = async (gcsUri = 'gs://ikhyeons/audio-files/녹음.mp3') => {
  let transcription = ''

  const audio = {
    // 오디오 파일의 경로
    uri: gcsUri,
  }
  const config = {
    //오디포 파일의 인코딩, 헤르츠 수, 언어코드
    encoding: 'MP3',
    sampleRateHertz: 48000,
    languageCode: 'ko-kr',
  }
  const request = {
    // 생성 리퀘스트 객체
    audio: audio,
    config: config,
  }

  // 오디오 파일을 탐지함
  const [response] = await client.recognize(request) // 요청에 대한 탐지 결과 반납

  transcription = response.results // 탐지 결과
    .map((result) => result.alternatives[0])

  return transcription[0].transcript
}
