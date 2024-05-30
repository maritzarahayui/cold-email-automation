// src/services/mailer.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    port: 465,
    host: "smtp.gmail.com",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    secure: true, // upgrades later with STARTTLS -- change this based on the PORT

});


const sendTextMail = (mailData, callback) => {
    transporter.sendMail(mailData, callback);
};

const sendAttachmentsMail = (mailData, callback) => {
    transporter.sendMail(mailData, callback);
};

module.exports = {
    sendTextMail,
    sendAttachmentsMail
};
