# gptConnecter

chatGPT와 라즈베리파이, 아두이노를 연동하여
인공지능 비서를 제작 중에 있음.

- 호출 → 저기요. : gptConnecter가 반응하며 바로 녹음을 시작 함.
- 입력 → 빵 굽는 법 알려줘 : mic로 음성이 들어가면 라즈베리파이에서 해당 음성을 mp3로 변환함.
- 전송 → mp3로 변환된 음성을 node서버에 전달함
- 변환 → node서버에 전달된 음성이 googleCloud의 stt기능을 거쳐서 text로 변환 됨
- 응답 → 해당 text를 gpt3.5 turbo에 전달하여 답변을 받음 : 1. 반죽한다 2. 굽는다 3. 맛있게 먹는다.
- 변환 → 응답받은 text 내용을 다시 tts하여 음성 변환한 후 mp3파일을 라즈베리파이로 전달 함.
- 출력 → 전달받은 mp3를 라즈베리파이 스피커로 출력함.

node서버 구현완료 / 구글 stt 구현완료 / GPT3.5 Turbo 연동 완료 / 라즈베리파이 기기 기다리는 중.
