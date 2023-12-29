import mysql from "mysql2/promise";
import config from "../secrets/mysqlConfig.js";
const pool = mysql.createPool(config);

export const getConnection = () => pool.getConnection();
export default getConnection;
