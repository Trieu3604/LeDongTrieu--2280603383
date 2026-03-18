const jwt = require('jsonwebtoken')

module.exports = {
    verifyToken: function (req, res, next) {
        try {
            let token = req.headers.authorization;

            if (!token) {
                return res.status(401).send({ message: "Chưa đăng nhập" });
            }

            token = token.split(" ")[1];

            let decoded = jwt.verify(token, "SECRET_KEY");

            req.user = decoded;

            next();
        } catch (error) {
            res.status(401).send({ message: "Token không hợp lệ" });
        }
    }
}