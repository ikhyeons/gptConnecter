//GPT Request 설정
import gptKey from "../secrets/apiKey.js";
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  organization: "org-3zrb4sS5xFw2byNjGGciHYYb",
  apiKey: gptKey,
});

const openai = new OpenAIApi(configuration);
/**
 *
 * @param {'GPT에 물어 볼 텍스트'} STTOutPut
 * @returns {'GPT에서 나온 답변을 텍스트화하여 출력'}
 */
export const gptResponse = async (STTOutPut) => {
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
export default gptResponse;
