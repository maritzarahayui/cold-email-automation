const { storeData, db } = require('../services/storeData');

const OpenAI = require("openai");
const dotenv = require("dotenv");
const result = dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
});

let userProfile;

const chatHandler = async (req, res) => {
  try {
    const { prompt } = req.body;
    const promptText = `Buatkan sebuah template email untuk customer tentang ${prompt}. Berikan juga caption di akhir yang menampilkan salam penutup dari Algo Network`;

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

<<<<<<< HEAD
    generatedEmailContent = accumulatedData; // connect with email

=======
>>>>>>> 3f7cb27ac2bd8c676aba6236643f2ddd1f9fab2d
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

    await storeData(user.id, data);
<<<<<<< HEAD
 
    console.log("isi data " + data) // delete
=======
>>>>>>> 3f7cb27ac2bd8c676aba6236643f2ddd1f9fab2d

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
<<<<<<< HEAD
      generatedEmailContent += text; // connect with email
=======
>>>>>>> 3f7cb27ac2bd8c676aba6236643f2ddd1f9fab2d
    }
  } catch (error) {
    console.error("Error processing chunk:", chunk, error);
  }
}

<<<<<<< HEAD
// mail
// src/server/handler.js
const { sendTextMail, sendAttachmentsMail } = require('../services/mailer');
const { getMaxListeners } = require('nodemailer/lib/xoauth2');

const sendTextMailHandler = async (req, res) => {
  const { to, text, subject, html } = req.body;

  try {
    const mailData = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      text: text, // For clients not supporting HTML
      html: html || `<b>${text}</b>`, // Use the generated content as HTML
    };

    sendTextMail(mailData, (error, info) => {
      if (error) {
        console.log(error);
        return res.status(500).send({ error: "Failed to send mail" });
      }
      res.status(200).send({ message: "Mail sent", message_id: info.messageId });
    });
  } catch (error) {
    console.error("Failed to fetch data from Firestore:", error);
    res.status(500).send({ error: "Failed to fetch data" });
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
        res.status(200).send({ message: "Mail sent", message_id: info.messageId });
    });
};

// module.exports = {
//     sendTextMail: sendTextMailHandler,
//     sendAttachmentsMail: sendAttachmentsMailHandler
// };


module.exports = {
  chatHandler,
  sendTextMailHandler,
  sendAttachmentsMailHandler,
=======
module.exports = {
  chatHandler,
>>>>>>> 3f7cb27ac2bd8c676aba6236643f2ddd1f9fab2d
  userProfile,
};
