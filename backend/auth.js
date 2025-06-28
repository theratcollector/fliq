const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const {saveMessage, getHistory, saveUser, findUserByEmail} = require("./db");


function login(email, password) {
    const user = findUserByEmail(email);
    if(!user || !bcrypt.compareSync(password, user.password)){
        throw new Error("Invalid Login")
    }

    const token = jwt.sign({id:user.id, email: user.email}, process.env.JWT_SECRET, {expiresIn:"96h"});
    return token;
}


function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.sendStatus(401);

  const token = authHeader.split(' ')[1]; // "Bearer <token>"
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.sendStatus(403);
  }
}

module.exports = { login, verifyToken };
