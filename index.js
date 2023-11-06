const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "goodreads.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
const authorization = async (request, response, next) => {
  const token = request.headers["authorization"].split(" ")[1];
  try {
    let data = jwt.verify(token, "token");
    request.username = data.username;
    next();
  } catch (error) {
    response.status(401);
    response.send("unAuthorized");
  }
};
app.get("/users/", authorization, async (request, response) => {
  let { username } = request;
  const getBooksQuery = `
      SELECT
        *
      FROM
        user
        WHERE 
      username = '${username}'`;
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});
// Crreate User API
app.post("/users/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedpassword = await bcrypt.hash(password, 10);
  console.log("---->", hashedpassword);
  const getUserQuery = `
      SELECT
        *
      FROM
        user
      WHERE
       username = '${username}'`;
  const getUser = await db.get(getUserQuery);
  console.log("getUser--->", getUser);

  if (getUser) {
    console.log("user exist");
  } else {
    console.log("no user found");
    const createUserQuery = `
  INSERT INTO
    user (username, name, password, gender, location)
  VALUES
    (
      '${username}',
      '${name}',
      '${hashedpassword}',
      '${gender}',
      '${location}'  
    );`;
    const getUser = await db.run(createUserQuery);
  }
  response.send("user register sussfully");
});

// LOGIN User API
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const getUserQuery = `
      SELECT
        *
      FROM
        user
      WHERE
       username = '${username}'`;
  const getUser = await db.get(getUserQuery);
  if (getUser) {
    console.log("user exist");
    const passwordMatch = await bcrypt.compare(password, getUser.password);
    if (passwordMatch) {
      const payload = { username: getUser.username };
      const jwt_token = jwt.sign(payload, "token");
      console.log("login successfully");
      console.log("jwt_token", jwt_token);

      //   const jwt_token_verify = jwt.verify(jwt_token, "token");
      //   console.log("jwt_token_verify", jwt_token_verify);
    } else {
      console.log("wrong password");
      // const getUser = await db.run(createUserQuery);
    }
  } else {
    console.log("no user found");
  }
  response.send("-------");
});
