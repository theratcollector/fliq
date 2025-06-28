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


function verifyToken(token) {
  try{
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return{valid:true, decoded:decoded};
  }catch(err){
    return{valid:false, error:err.message};
  }
}

module.exports = { login, verifyToken };
