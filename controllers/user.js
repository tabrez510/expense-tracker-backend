const bcrypt = require('bcrypt');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

function generatedWebToken (id, name, isPremiumUser) {
    return jwt.sign({userId: id, name, isPremiumUser}, process.env.TOKEN_SECRET);
}

const createUser = async (req, res) => {

    try {
        const {name, email, password} = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({name, email, isPremiumUser: false, password: hashedPassword});
        res.json({success: true, exists: false, ...user.dataValues, token: generatedWebToken(user.id, user.name, false) });
    } catch(err) {
        console.log(err);
        res.status(500).json({success: false, err: err, message: 'Internal Server Error'});
    }
}

const checkEmail = async (req, res) => {
    const {email} = req.body;

    try {
        const existingUser = await User.findOne({where : { email }});
        if(existingUser) {
            return res.json({ exists: true, error: 'Email already exists'});
        } else {
            return res.json({exists: false});
        }
    } catch(err) {
        res.status(500).json({success: false, message: 'Internal Server Error'});
    }
}

const checkPassword = async (req, res) => {
    try {
        const {email, password} = req.body;
        const existingUser = await User.findOne({where : { email }});
        if(!existingUser) {
            return res.status(404).json({match: false, message: 'User not found'});
        }
        else {
            const hashedPasswordFromDatabase = existingUser.password;

            const isMatch = await bcrypt.compare(password, hashedPasswordFromDatabase);

            if(isMatch){
                return res.status(200).json({match: true, message: null, token: generatedWebToken(existingUser.id, existingUser.name, existingUser.isPremiumUser)});
            }
            else {
                return res.status(401).json({match: false, message: 'Incorrect password'});
            }
        }
    } catch(err){
        res.status(500).json({success: false, message: "Internal Server error"});
    }
}

const getUserDetails = async(req, res) => {
    try {
        const userDetails = await User.findByPk(req.user.id);
        const id = userDetails.id;
        const name = userDetails.name;
        const isPremiumUser = userDetails.isPremiumUser;
        if(userDetails){
            res.status(200).json({success: true, id, name, isPremiumUser});
        } else {
            res.status(404).json({success: false, message: 'Login Again'});
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({success: false, message: 'Internal Server Error'});
    }
}

module.exports = {
    generatedWebToken,
    createUser,
    checkEmail,
    checkPassword,
    getUserDetails
}
