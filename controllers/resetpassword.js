const uuid = require('uuid');
const bcrypt = require('bcrypt');
const SibApiV3Sdk = require('@getbrevo/brevo');

const User = require('../models/user');
const Forgotpassword = require('../models/forgotpassword');

const forgotpassword = async (req, res) => {
    try {
        const { email } =  req.body;
        const user = await User.findOne({where : { email }});
        if(user){
            const id = uuid.v4();
            await user.createForgotpassword({ id , active: true });

            // Initialize the TransactionalEmailsApi instance
            let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

            // Set the API key
            let apiKey = apiInstance.authentications['apiKey'];
            apiKey.apiKey = process.env.BREVO_API_KEY;

            // Construct the SendSmtpEmail object
            let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail(); 
            sendSmtpEmail.subject = "Forgot Password";
            sendSmtpEmail.textContent = "Visit this link to reset your password";
            sendSmtpEmail.htmlContent = `<a href="http://localhost:3000/api/password/resetpassword/${id}">Reset password</a>`,
            sendSmtpEmail.sender = {"name": "Md Tabrez Alam", "email": "alamtabrez510@gmail.com"};
            sendSmtpEmail.to = [{"email": `${email}`}];

            // Send the transactional email
            try{
                const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
                console.log(JSON.stringify(data));
                res.status(200).json({ success: true, message: "Password reset email sent successfully" });
            } catch(err) {
                console.error("Error sending password reset email:", err);
                res.status(500).json({ success: false, message: "Failed to send password reset email" });
            }

        }else {
            res.status(404).json({success: false, message: 'Email does not exist'});
        }
    } catch(err){
        console.error(err)
        return res.json({ message: err, sucess: false });
    }

}

const resetpassword = async(req, res) => {
    const id =  req.params.id;
    const forgotpasswordrequest = await Forgotpassword.findOne({ where : { id }});
    if(forgotpasswordrequest){
        await forgotpasswordrequest.update({ active: false});
        res.status(200).send(`<html>
                                <script>
                                    function formsubmitted(e){
                                        e.preventDefault();
                                        console.log('called')
                                    }
                                </script>

                                <form action="/api/password/updatepassword/${id}" method="get">
                                    <label for="newpassword">Enter New password</label>
                                    <input name="newpassword" type="password" required></input>
                                    <button>reset password</button>
                                </form>
                            </html>`
                            )
        res.end()

    }
}

const updatepassword = async(req, res) => {

    try {
        const { newpassword } = req.query;
        const { resetpasswordid } = req.params;
        const resetpasswordrequest = await Forgotpassword.findOne({ where : { id: resetpasswordid }});
        const user = await User.findOne({where: { id : resetpasswordrequest.userId}});
                // console.log('userDetails', user)
        if(user) {

            const saltRounds = 10;
            bcrypt.genSalt(saltRounds, function(err, salt) {
                if(err){
                    console.log(err);
                    throw new Error(err);
                }
                bcrypt.hash(newpassword, salt, async function(err, hash) {
                    if(err){
                        console.log(err);
                        throw new Error(err);
                    }
                    await user.update({ password: hash });
                    res.status(201).json({message: 'Successfuly update the new password'});
                });
            });
        } else{
            return res.status(404).json({ error: 'No user Exists', success: false})
        }
    } catch(error){
        return res.status(403).json({ error, success: false } )
    }

}


module.exports = {
    forgotpassword,
    updatepassword,
    resetpassword
}