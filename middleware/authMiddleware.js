import jwt from "jsonwebtoken";
import getConnection from "../sources/connection.js";
import jwtKey from "../secrets/jwtKey.js";

export const auth = async (req, res, next) => {
  if (req.path == "/logout") {
    return next();
  }

  try {
    if (req.headers.authorization) {
      //1. 정상작동
      req.decoded = jwt.verify(req.headers.authorization, jwtKey);
      return next();
    } else {
      //2. 토큰이 오지 않았을 경우
      res.clearCookie("token");
      return res.status(419).json({
        code: 401,
        message: "토큰이 소실되었습니다.",
      });
    }
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      //3. 토큰이 만료되었을 경우
      //쿠키로 리프레시 토큰의 유효성을 확인
      try {
        const ma = req.cookies.ma;
        const conn = await getConnection();
        const tokenQuery = "SELECT token FROM rft WHERE ma = ?";
        const [getInfo] = await conn.query(tokenQuery, [ma]);

        const refToken = jwt.verify(getInfo[0].token, jwtKey);
        //3.1 리프레시 토큰이 있을 경우
        //엑세스 토큰 재발급
        let token = jwt.sign(
          {
            type: "JWT",
            ma: ma,
            password: refToken.password,
          },
          jwtKey,
          {
            expiresIn: "15m",
            issuer: "admin",
          }
        );
        conn.release();
        return res
          .status(202)
          .cookie("token", token, {})
          .cookie("ma", ma, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 30,
          })
          .json({
            code: 202,
            token: token,
            message: "토큰 재발급",
          });
      } catch (error) {
        if (error.name === "TokenExpiredError") {
          //3.2 리프레시 토큰이 만료됬을 경우
          //로그아웃
          res.clearCookie("token");
          res.clearCookie("ma");
          return res.status(418).json({
            code: 418,
            message: "리프레시 토큰 만료로 로그아웃 되었습니다.",
          });
        } else {
          console.log(error);
          //3.3 리프레시 토큰 만료 외 다른 에러
          res.clearCookie("token");
          res.clearCookie("ma");
          return res.status(418).json({
            code: 419,
            message: "다른 문제.",
          });
        }
      }
    }
    if (error.name === "JsonWebTokenError") {
      //4. 토큰의 키에 오류가 있을 경우
      res.clearCookie("token");
      return res.status(401).json({
        code: 401,
        message: "유효하지 않은 토큰입니다.",
      });
    }
  }
};

export default auth;
