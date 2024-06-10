const nodemailer = require('nodemailer');
const scheduler = require('node-cron');
const moment = require('moment'); 

const transporter = nodemailer.createTransport({
    port: 465,
    host: "smtp.gmail.com",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    secure: true,

});


const sendTextMail = (mailData, callback) => {
    console.log('send email')
    transporter.sendMail(mailData, callback);
};

const sendAttachmentsMail = (mailData, callback) => {
    console.log('send attachment')
    transporter.sendMail(mailData, callback);
};

const scheduleEmail = (mailData, delayMinutes) => {
    console.log(`Scheduling email to be sent in ${delayMinutes} minutes`);
    const scheduleDate = moment(scheduleTime);
    const delayMilliseconds = scheduleDate.diff(moment(), 'milliseconds') + 60000; // Add 1 minute (60000 milliseconds)

    setTimeout(() => {
        sendTextMail(mailData, (err, info) => {
            if (err) {
                console.error('Error sending email:', err);
            } else {
                console.log('Email sent:', info.response);
            }
        });
    }, delayMilliseconds); // Convert minutes to milliseconds
};

module.exports = {
    sendTextMail,
    sendAttachmentsMail,
    scheduleEmail
};
