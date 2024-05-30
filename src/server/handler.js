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

module.exports = {
  chatHandler,
  userProfile,
};
