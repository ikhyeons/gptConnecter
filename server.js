import cors from "cors";
import getConnection from "./sources/connection.js";
import requestTTS from "./sources/requestTTS.js";
import sendMP3F from "./sources/sendMP3F.js";
import sttFunction from "./sources/sttFunction.js";
import gptResponse from "./sources/gptResponse.js";
import jwt from "jsonwebtoken";
//gptAPI Key
import jwtKey from "./secrets/jwtKey.js";

//middleWare
import authMiddleware from "./middleware/authMiddleware.js";

//Server 설정
import express from "express";
const app = express();
const port = 2000;
app.use(express.json());
app.listen(port, () => {
  console.log(`server run in ${port}`);
});

//multer 구글 클라우드 설정

import Multer from "multer";

const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 30 * 1024 * 1024, // no larger than 5mb, you can change as needed.
  },
});

let corsOptions = {
  origin: ["*"],
  credentials: true,
};

app.use(cors(corsOptions));

//실제 api 구동 부
app.post("/request", multer.single("file"), async (req, res) => {
  //req에서 받은 파일을 클라우드에 저장
  const fileName = await sendMP3F(req);

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

    const ma = req.body.ma;
    if (ma) {
      const query = "INSERT INTO qna VALUES(default, ?, ?, ?, default)";
      const conn = await getConnection();
      await conn.query(query, [ma, STTData, returnFromGPT]);
      conn.release();
    }

    return res.sendFile(
      "C:/Users/skant/OneDrive/Desktop/Projects/gptConnecter(졸작)/output/output.mp3"
    );
  }
});

//회원가입
app.post("/join", async (req, res) => {
  const { ma, password } = req.body;
  const query = "INSERT INTO user VALUES(?, ?)";
  const conn = await getConnection();
  await conn.query(query, [ma, password]);
  conn.release();
  return res.send(0);
});

// 로그인
app.post("/login", async (req, res) => {
  const { ma, password } = req.body;

  const maQuery =
    "SELECT password, token FROM user LEFT JOIN rft ON rft.ma = user.ma WHERE user.ma = ?";
  const conn = await getConnection();
  const [getInfo] = await conn.query(maQuery, [ma]);
  //ma가 미등록일 시
  if (!getInfo[0]) {
    return res.status(401).send({ code: 401, message: "ma not found" });
  }
  //password를 찾을 수 없을 시
  if (getInfo[0].password !== password)
    return res.status(401).send({ code: 401, message: "pw not found" });

  //리프레시 토큰 생성
  let rtoken = jwt.sign(
    {
      type: "JWT",
      ma: ma,
      password: password,
    },
    jwtKey,
    {
      expiresIn: "30d",
      issuer: "admin",
    }
  );

  if (!getInfo[0].token) {
    //1. 만약 refreshToken이 없을 경우 토큰 생성
    //토큰생성
    const tokenQuery = "INSERT INTO token VALUES(?, ?)";
    await conn.query(tokenQuery, [ma, rtoken]);
  } else {
    //2. 만약 refreshToken이 있을 경우 토큰 시간 갱신
    //토큰갱신
    const tokenQuery = "UPDATE token SET token = ? where ma = ?";
    await conn.query(tokenQuery, [rtoken, ma]);
  }

  //리턴 토큰 생성
  let token = jwt.sign(
    {
      type: "JWT",
      password: password,
      ma: getInfo[0].ma,
    },
    jwtKey,
    {
      expiresIn: "15m",
      issuer: "admin",
    }
  );
  conn.release();
  return res
    .status(200)
    .cookie("token", token, { sameSite: "none", secure: true })
    .cookie("ma", ma, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 30,
      sameSite: "none",
      secure: true,
    })
    .json({
      code: 200,
      token: token,
    });
});

// 로그아웃
app.post("/logout", async (req, res) => {
  //쿠키파싱
  //만약 refresh 토큰이 있을경우 토큰 제거
  const conn = await getConnection();
  const ma = req.cookies.ma;
  const deleteTokenQuery = "DELETE FROM rft WHERE ma = ?";
  await conn.query(deleteTokenQuery, [ma]);
  conn.release();
  res.clearCookie("token");
  res.clearCookie("ma");
  return res.status(200).json({
    code: 200,
    message: "로그아웃 되었습니다.",
  });
});

// 전체조회
app.get("/list", authMiddleware, async (req, res) => {
  const conn = await getConnection();
  const ma = req.decode.ma;
  const listTokenQuery = "SELECT * FROM qna WHERE ma = ?";
  const [getInfo] = await conn.query(listTokenQuery, [ma]);
  conn.release();
  res.send(getInfo);
});

// 검색조회
app.get("/search", async (req, res) => {
  const keyword = req.params.keyword;
  const trimkeyword = `%${keyword}%`;
  const conn = await getConnection();
  const ma = req.decode.ma;
  const searchTokenQuery =
    "SELECT * FROM qna WHERE ma = ? AND req like ? or res like ?";
  const [getInfo] = await conn.query(searchTokenQuery, [
    ma,
    trimkeyword,
    trimkeyword,
  ]);
  conn.release();
  res.send(getInfo);
});

// 소켓
