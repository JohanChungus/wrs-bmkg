const { inspect } = require("util");
const slimbot = require("slimbot");
const miniget = require("miniget");
const wrs = require("wrs-bmkg")();

wrs.recvWarn = 0;
require("dotenv").config();
const bot = new slimbot(process.env.BOT_TOKEN);
const subscriber = [];

bot.on("message", async (message) => {
  if (!message.text || !message.text.startsWith("/start")) return;
  if (!subscriber.includes(message.chat.id)) subscriber.push(message.chat.id);
  await bot.sendPhoto(
    message.chat.id,
    `https://data.bmkg.go.id/DataMKG/TEWS/${wrs.lastAlert.info.shakemap}`,
    {
      caption: `*ℹ️${wrs.lastAlert.info.subject}*\n\n${wrs.lastAlert.info.description}\n\n${wrs.lastAlert.info.headline}\n\n⚠️${wrs.lastAlert.info.instruction}`,
      parse_mode: "Markdown",
    }
  );
  let text = "*⚠️Gempa Realtime*";
  text += `\nWaktu: ${new Date(
    wrs.lastRealtimeQL.properties.time
  ).toLocaleString("en-US", { timeZone: "Asia/Jakarta" })}`;
  text += `\nMagnitude: ${(Number(wrs.lastRealtimeQL.properties.mag) / 1000).toFixed(1)} M`;
  text += `\nFase: ${wrs.lastRealtimeQL.properties.fase}`;
  text += `\nStatus: ${wrs.lastRealtimeQL.properties.status}`;
  text += `\nKedalaman: ${(Number(wrs.lastRealtimeQL.properties.depth) / 1000).toFixed(1)} KM`;
  let locationMessage = await bot.sendLocation(
    message.chat.id,
    wrs.lastRealtimeQL.geometry.coordinates[1],
    wrs.lastRealtimeQL.geometry.coordinates[0]
  );
  await bot.sendMessage(message.chat.id, text, {
    parse_mode: "Markdown",
    reply_to_message_id: locationMessage.result.message_id,
  });
});

wrs.on("Gempabumi", (msg) => {
  if (wrs.recvWarn !== 2) return wrs.recvWarn++
  let text = `ℹ️*${msg.subject}*`;
  text += `\n\n${msg.description}\n\n${msg.headline}`;
  subscriber.forEach(async (id) => {
    await bot.sendPhoto(
      id,
      `https://data.bmkg.go.id/DataMKG/TEWS/${msg.shakemap}`,
      {
        caption: `*ℹ️${msg.subject}*\n\n${msg.description}\n\n${msg.headline}\n\n⚠️${msg.instruction}`,
        parse_mode: "Markdown",
      }
    );
  });
});

wrs.on("realtime", (msg) => {
  if (wrs.recvWarn !== 2) return wrs.recvWarn++
  let text = "*ℹ️Informasi Gempa*";
  text += `\nWaktu: ${new Date(msg.properties.time).toLocaleString("en-US", {
    timeZone: "Asia/Jakarta",
  })}`;
  text += `\nMagnitude: ${(Number(msg.properties.mag) / 1000).toFixed(1)} M`;
  text += `\nFase: ${msg.properties.fase}`;
  text += `\nStatus: ${msg.properties.status}`;
  text += `\nKedalaman: ${(Number(msg.properties.depth) / 1000).toFixed(1)} KM`;

  subscriber.forEach(async (id) => {
    await bot.sendMessage(
      id,
      "*⚠️Mohon Perhatian. Baru saja terjadi gempa bumi.*",
      { parse_mode: "Markdown" }
    );
    let locationMessage = await bot.sendLocation(
      id,
      msg.geometry.coordinates[1],
      msg.geometry.coordinates[0]
    );
    await bot.sendMessage(id, text, {
      parse_mode: "Markdown",
      reply_to_message_id: locationMessage.result.message_id,
    });
  });
});

wrs.startPolling();
bot.startPolling();
