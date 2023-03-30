const express = require("express");
const path = require("path");

const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "userData.db");
let db = null;

const initializeDBServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("The Server Is Deployed.... :]");
    });
  } catch (err) {
    console.log(`Error: ${err.message}`);
    process.exit(1);
  }
};

initializeDBServer();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const checkUserName = `
    SELECT *
        FROM user
    WHERE username='${username}'`;

  const checkNameResponse = await db.get(checkUserName);

  if (checkNameResponse !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const insertNewUserQuery = `
        INSERT INTO user (username, name, password, gender, location)
            VALUES 
            ('${username}',
            '${name}',
            '${hashedPassword}',
            '${gender}',
            '${location}');`;

      await db.run(insertNewUserQuery);
      response.send("User created successfully");
    }
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const checkUserQuery = `
  SELECT * 
    FROM user
  WHERE username = '${username}';`;

  const checkUserResponse = await db.get(checkUserQuery);

  if (checkUserResponse === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      checkUserResponse.password
    );

    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const newHashedPassword = await bcrypt.hash(newPassword, 10);
  const checkUserQuery = `
    SELECT *
        FROM user
    WHERE username='${username}';`;
  const checkUserResponse = await db.get(checkUserQuery);

  if (checkUserResponse !== undefined) {
    const checkOldPassword = await bcrypt.compare(
      oldPassword,
      checkUserResponse.password
    );

    if (checkOldPassword === true) {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const updatePasswordQuery = `
            UPDATE user
                SET password='${newHashedPassword}'
            WHERE username='${username}';`;

        await db.run(updatePasswordQuery);

        response.status(200);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  } else {
    response.status(400);
    response.send("Invalid user");
  }
});

module.exports = app;
