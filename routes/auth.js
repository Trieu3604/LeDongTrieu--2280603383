let express = require('express');
let router = express.Router()
let userController = require('../controllers/users')
let bcrypt = require('bcrypt')
let jwt = require('jsonwebtoken')
let { verifyToken } = require('../utils/authHandler')
let userModel = require('../schemas/users')
const crypto = require('crypto');
let userModel = require('../schemas/users');

router.post('/change-password', verifyToken, async (req, res) => {
    try {
        let { oldPassword, newPassword } = req.body;

        let user = await userModel.findById(req.user.id);

        if (!bcrypt.compareSync(oldPassword, user.password)) {
            return res.status(400).send({
                message: "Sai mật khẩu cũ"
            })
        }

        user.password = newPassword; 
        await user.save();

        res.send({ message: "Đổi mật khẩu thành công" })

    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})

router.post('/register', async function (req, res, next) {
    try {
        let { username, password, email } = req.body;
        let newUser = await userController.CreateAnUser(username, password, email,
            "69b1265c33c5468d1c85aad8"
        )
        res.send(newUser)
    } catch (error) {
        res.status(404).send({
            message: error.message
        })
    }
})

router.get('/me', verifyToken, async (req, res) => {
    let user = await userModel.findById(req.user.id);
    res.send(user);
})

router.post('/login', async function (req, res, next) {
    try {
        let { username, password } = req.body;
        let user = await userController.GetAnUserByUsername(username);
        if (!user) {
            res.status(404).send({
                message: "thong tin dang nhap khong dung"
            })
            return;
        }
        if (user.lockTime > Date.now()) {
            res.status(404).send({
                message: "ban dang bi ban"
            })
            return;
        }
        if (bcrypt.compareSync(password, user.password)) {
    user.loginCount = 0;
    await user.save()

    let token = jwt.sign(
        { id: user._id, role: user.role },
        "SECRET_KEY",
        { expiresIn: "1h" }
    );

    res.send({
        token,
        user: {
            id: user._id,
            username: user.username
        }
    })
} else {
            user.loginCount++;
            if (user.loginCount == 3) {
                user.loginCount = 0;
                user.lockTime = Date.now() + 3600 * 1000;
            }
            await user.save()
            res.status(404).send({
                message: "thong tin dang nhap khong dung"
            })
        }
    } catch (error) {
        res.status(404).send({
            message: error.message
        })
    }
})

// ===================== FORGOT PASSWORD =====================
router.post('/forgot-password', async (req, res) => {
    try {
        let { email } = req.body;

        let user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).send({
                message: "Email không tồn tại"
            });
        }

    
        let resetToken = crypto.randomBytes(32).toString('hex');

     
        user.resetToken = resetToken;
        user.resetTokenExpire = Date.now() + 10 * 60 * 1000;

        await user.save();

        let resetLink = `http://localhost:3000/reset-password/${resetToken}`;
        console.log("RESET LINK:", resetLink);

        res.send({
            message: "Đã tạo link reset password",
            resetLink 
        });

    } catch (error) {
        res.status(500).send({
            message: error.message
        });
    }
});
module.exports = router