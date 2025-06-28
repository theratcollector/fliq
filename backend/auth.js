const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();

const {saveMessage, getHistory, saveUser, findUserByusername} = require("./db");


async function login(username, password) {
    const user = findUserByusername(username);
    if(!user || !bcrypt.compareSync(password, user.password)){
        console.log("no user found, or other error");
        throw new Error("Invalid Login");
    }

    const token = jwt.sign({id:user.id, username: user.username}, process.env.JWT_SECRET, {expiresIn:"96h"});
    return token;
}


function verifyToken(token) {
  try{
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return{valid:true, decoded:decoded};
  }catch(err){
    return{valid:false, error:err.message};
  }
}

module.exports = { login, verifyToken };
