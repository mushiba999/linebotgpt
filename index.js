"use strict";

require("dotenv").config();
const express = require("express");
const line = require("@line/bot-sdk");
const PORT = process.env.PORT || 5000;

const config = {
  channelSecret: process.env.LINE_CHANNEL_SECRET,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
};

const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();

app.post("/webhook", line.middleware(config), (req, res) => {
  console.log(req.body.events);

  Promise.all(req.body.events.map(handleEvent)).then((result) =>
    res.json(result)
  );
});

const client = new line.Client(config);

// 初期の会話状態を保存する変数
let conversationState = [];

async function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") {
    return Promise.resolve(null);
  }

  // ユーザーのメッセージを会話に追加
  conversationState.push({ role: "user", content: event.message.text });

  // 会話をOpenAIに送信して応答を取得
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: conversationState, // すべてのメッセージを送信
  });

  // OpenAIからの応答を会話に追加
  conversationState.push({
    role: "assistant",
    content: completion.choices[0].message.content,
  });

  // ユーザーに応答を返信
  return client.replyMessage(event.replyToken, [
    { type: "text", text: completion.choices[0].message.content },
  ]);
}

//app.listen(PORT);
//console.log(`Server running at ${PORT}`);
(process.env.NOW_REGION) ? module.exports = app : app.listen(PORT);
console.log(`Server running at ${PORT}`);