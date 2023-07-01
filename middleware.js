const jwt = require('jsonwebtoken');
const user = require("./models/user");

/**
 * Block the route if the user
 * is not authenticated
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      console.warn(err)
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
};

/**
 * Block the route if the user
 * is not authenticated and an admin
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
const authenticateTokenAndAdminUser = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, usr) => {
    if (err) {
      return res.sendStatus(403);
    }
    else {
      user.findOne({ username: usr.username }, (err, user) => {
        if (err) {
          return res.sendStatus(403)
        }
        if(user.level === 'ADMIN'){
          next();
        }
        else {
          return res.sendStatus(403)
        }
      });
    }
  });
};

module.exports = { authenticateToken, authenticateTokenAndAdminUser };