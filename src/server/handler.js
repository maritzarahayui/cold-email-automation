const { storeData, db } = require('../services/storeData');

const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
});

let userProfile;

const chatHandler = async (req, res) => {
  try {
    const { prompt, language } = req.body;
    const promptText = `Buatkan sebuah template email untuk customer tentang ${prompt} dengan bahasa ${language}. Berikan juga caption di akhir yang menampilkan salam penutup dari Algo Network`;

    const apiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + openai.apiKey,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant in generating email drafts.",
            },
            { role: "user", content: promptText },
          ],
          stream: true,
        }),
      }
    );

    if (!apiResponse.body) {
      res.status(500).send("Failed to obtain response body");
      return;
    }

    const reader = apiResponse.body.getReader();
    const decoder = new TextDecoder();
    let isFinished = false;
    let accumulatedData = "";

    while (!isFinished) {
      const { value, done } = await reader.read();
      isFinished = done;
      accumulatedData += decoder.decode(value, { stream: !done });

      let boundary = accumulatedData.indexOf("\n");
      while (boundary !== -1) {
        const chunk = accumulatedData.substring(0, boundary);
        accumulatedData = accumulatedData.substring(boundary + 1);
        processChunk(chunk, res);
        boundary = accumulatedData.indexOf("\n");
      }
    }

    const user = req.user;
    const createdAt = new Date().toISOString();
    const data = {
      prompt: prompt,
      result: accumulatedData,
      user: {
        id: user.id,
        email: user.emails[0].value,
        name: user.displayName,
      },
      createdAt: createdAt
    };

    await storeData('database', data);

    res.end();

  } catch (error) {
    console.error("Stream processing failed:", error);
    res.status(500).send("Stream processing failed");
  }
};

function processChunk(chunk, res) {
  if (chunk.trim() === "data: [DONE]" || !chunk.trim().startsWith("data:"))
    return;

  try {
    const json = JSON.parse(chunk.trim().replace("data: ", ""));
    const text = json.choices?.[0]?.delta?.content;
    if (text) {
      res.write(text);
    }
  } catch (error) {
    console.error("Error processing chunk:", chunk, error);
  }
}

const { sendTextMail, sendAttachmentsMail, scheduleEmail } = require('../services/mailer');
const { getMaxListeners } = require('nodemailer/lib/xoauth2');
const moment = require('moment'); 

const sendTextMailHandler = async (req, res) => {
  const { to, text, subject, html, scheduleTime } = req.body;

  try {
    let recipients = [];
    if (Array.isArray(to)) {
      recipients = to;
    } else {
      recipients = to.split(",").map(email => email.trim());
    }

    for (const recipient of recipients) {
      const mailData = {
        from: process.env.EMAIL_USER,
        to: recipient,
        subject: subject,
        text: text,
        html: html,
      };

      const scheduleDate = moment(scheduleTime);
      const delayMilliseconds = scheduleDate.diff(moment(), 'milliseconds');
      
      if (delayMilliseconds > 0) {
        setTimeout(() => {
          sendTextMail(mailData, async (err, info) => {
            if (err) {
              console.error('Error sending email:', err);
            } else {
              console.log('Email sent:', info.response);
              const user = req.user;
              const createdAt = new Date().toISOString();
              const emailData = {
                to: recipient,
                subject: subject,
                text: text,
                html: html,
                user: {
                  id: user.id,
                  email: user.emails[0].value,
                  name: user.displayName,
                },
                createdAt: createdAt
              };
              await storeData('sent-emails', emailData);
            }
          });
        }, delayMilliseconds);
      } else {
        sendTextMail(mailData, async (err, info) => {
          if (err) {
            console.error('Error sending email:', err);
          } else {
            console.log('Email sent:', info.response);
            const user = req.user;
            const createdAt = new Date().toISOString();
            const emailData = {
              to: recipient,
              subject: subject,
              text: text,
              html: html,
              user: {
                id: user.id,
                email: user.emails[0].value,
                name: user.displayName,
              },
              createdAt: createdAt
            };
            await storeData('sent-emails', emailData);
          }
        });
      }
    }

    res.status(200).send({ message: "Mail has been successfully scheduled to be sent to recipient(s)!" });
  } catch (error) {
    console.error("Failed to schedule mail due to: ", error);
    res.status(500).send({ error: "Failed to schedule mail :(" });
  }
};


const sendAttachmentsMailHandler = (req, res) => {
  const { to, subject, text } = req.body;
  const mailData = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: subject,
    text: text,
    html: '<b>Hey there! </b><br> This is our first message sent with Nodemailer<br/>',
    attachments: [
      { filename: 'nodemailer.png', path: 'nodemailer.png' },
      { filename: 'text_file.txt', path: 'text_file.txt' }
    ]
  };

  sendAttachmentsMail(mailData, (error, info) => {
    if (error) {
      console.log(error);
      return res.status(500).send({ error: "Failed to send mail" });
    }
    res.status(200).send({ message: "Mail has been successfully sent!", message_id: info.messageId });
  });
};

const getAllSentEmails = async (req, res) => {
  try {
    const user = req.user;
    const snapshot = await db.collection('sent-emails').where('user.id', '==', user.id).get();
    const emails = [];
    snapshot.forEach(doc => {
      emails.push({ id: doc.id, ...doc.data() });
    });
    console.log("EMAILS: ", emails)
    res.render('email-history', { emails }); // Pass emails to the template
  } catch (error) {
    console.error("Failed to get emails due to: ", error);
    res.status(500).send({ error: "Failed to get emails :(" });
  }
};

const getEmailById = async (req, res) => {
  try {
    const emailId = req.params.id; 
    const doc = await db.collection('sent-emails').doc(emailId).get();

    if (!doc.exists) {
      return res.status(404).send({ error: 'Email not found' });
    }

    const emailData = { id: doc.id, ...doc.data() };
    console.log("EMAIL: ", emailData);
    res.render('email-detail', { email: emailData }); // Kirim data email ke template

  } catch (error) {
    console.error("Failed to get email due to: ", error);
    res.status(500).send({ error: "Failed to get email :(" });
  }
};

module.exports = {
  chatHandler,
  sendTextMailHandler,
  sendAttachmentsMailHandler,
  getAllSentEmails,
  getEmailById,
  userProfile,
};