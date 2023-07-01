const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const user = require("../models/user");
dotenv.config();

/**
 * Basic user check implementation
 * Returns a JWT token
 *
 * @param {*} req
 * @param {*} res
 */
exports.login = (req, res) => {
  const { email, password } = req.body;
  user.findOne({ username: email }, (err, user) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found or credentials are wrong" });
    }

    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        return res.status(500).json({ message: err.message });
      }

      if (!result) {
        return res
          .status(401)
          .json({ message: "User not found or credentials are wrong" });
      }

      const accessToken = jwt.sign(
        {
          username: user.username,
          level: user.level ?? 'USER'
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "12h", // expires in 12 hours
        },
      );
      res.json({ accessToken: accessToken });
    });
  });
};

/**
 * Used in order to protect the routes
 * If the user is an admin he can access the route
 * otherwise a 403 error is presented
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
exports.authenticateAdmin = (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);
  console.warn(process.env.ACCESS_TOKEN_SECRET);
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
          return res.sendStatus(200);
        }
        else {
          return res.sendStatus(403)
        }
      });
    }
  });
};
