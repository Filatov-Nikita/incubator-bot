import Config from './app/core/config.js';
import { Telegraf } from 'telegraf';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import fs from 'fs';

const config = new Config();

const token = config.get('BOT_TOKEN');

const privateKey = JSON.parse(fs.readFileSync('./tgbotgoogle.json')).private_key;

const doc = new GoogleSpreadsheet('1H2KLTUk6nOlIL6kI3_Z3GqGK1LVGP5rc01Gj8AKLFUs');

await doc.useServiceAccountAuth({
  client_email: config.get('EMAIL'),
  private_key: privateKey
});


const bot = new Telegraf(token);

bot.start(onStart);
bot.command('products', onProducts);
bot.command('dates', onDates);
bot.command('contacts', onContacts);

async function onProducts(ctx) {
  await doc.loadInfo();

  const sheet = doc.sheetsByIndex[0];

  const rows = await sheet.getRows();

  ctx.reply(getProductsMsg(rows));
}

async function onContacts(ctx) {
  ctx.reply(`Мы здесь`);
  ctx.replyWithLocation('54.385167', '56.218986');
  ctx.reply(`Телефон: +79273348080`);
};


async function onDates(ctx) {
  await doc.loadInfo();

  const sheet = doc.sheetsByIndex[1];

  const rows = await sheet.getRows();

  ctx.reply(getDatesMsg(rows));
}

function onStart(ctx) {
  ctx.reply(getWelcomeMsg());
}

function getDatesMsg(rows) {
  return rows
  .map(row => `${row['Дата']} - ${row['Птица']}`)
  .join('\n');
}

function getProductsMsg(rows) {
  return rows
  .map(row => `${row['Наименование']} - цена ${row['Цена']} руб.`)
  .join('\n');
}

function getWelcomeMsg() {
  return `
Привет! Мы кармаскалинский инкубатор.

Здесь вы можете посмотреть наш текущий ассортимент и цены, график выводов и наше местоположение.

Вот список команд:
/products - наш ассортимент
/dates - график выводов
/contacts - наши контакты и местоположение
`
}

bot.launch();
