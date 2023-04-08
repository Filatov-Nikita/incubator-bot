import Config from './app/core/config.js';
import { Telegraf, Markup } from 'telegraf';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import fs from 'fs';
import axios from 'axios';
import LRUCache from 'lru-cache';

const cache = new LRUCache({ ttl: 100 * 60 * 5 });
const config = new Config();

const token = config.get('BOT_TOKEN');
const appHost = config.get('APP_HOST');
const productsUri = config.get('PRODUCTS_URI');
const appToken = config.get('APP_TOKEN');

const privateKey = JSON.parse(fs.readFileSync('./tgbotgoogle.json')).private_key;

const doc = new GoogleSpreadsheet('1H2KLTUk6nOlIL6kI3_Z3GqGK1LVGP5rc01Gj8AKLFUs');

await doc.useServiceAccountAuth({
  client_email: config.get('EMAIL'),
  private_key: privateKey
});


const bot = new Telegraf(token);

const productsBtn = 'Птица в наличии 🐣';
const datesBtn = 'График выводов 🗓';
const contactsBtn = 'Наши контакты 🚚';

bot.start(onStart);
bot.command('products', onProducts);
bot.command('dates', onDates);
bot.command('contacts', onContacts);
bot.hears(productsBtn, onProducts);
bot.hears(datesBtn, onDates);
bot.hears(contactsBtn, onContacts);

async function onProducts(ctx) {
  try {
    if(cache.has('products')) {
      return ctx.reply( getProductsMsg(cache.get('products')) );
    }

    const { data: cats } = await axios.get(`${appHost}/categories`, {
      headers: { token: appToken },
    });

    const catInd = cats.findIndex(cat => cat.name === 'Птица');
    if(catInd === -1) return;

    const { data: products } = await axios.get(`${appHost}/${productsUri}`, {
      headers: { token: appToken },
      params: {
        categoryId: cats[catInd].id,
        visible: '1'
      }
    });

    cache.set('products', products);

    ctx.reply(getProductsMsg(products));
  } catch(e) {
    console.log(e);
  }
}

async function onContacts(ctx) {
  await ctx.reply(`Кармаскалинский инкубатор`);
  await ctx.replyWithLocation('54.385167', '56.218986');
  await ctx.reply(`Продажа оптом и в розницу.
По всем вопросам: +7 (917) 750-56-55 - Наталья 🙋🏻‍♀️`);

  await ctx.reply(`Учалинский инкубатор`);
  await ctx.replyWithLocation('54.369529', '59.430770');
  await ctx.reply(`Продажа оптом и в розницу.
По всем вопросам: +7 (917) 425-95-78 - Константин 🙋🏻‍♂️`);
};


async function onDates(ctx) {
  await doc.loadInfo();

  const sheet = doc.sheetsByIndex[1];

  const rows = await sheet.getRows();

  ctx.reply(getDatesMsg(rows));
}

function onStart(ctx) {
  ctx.reply(
    getWelcomeMsg(),
    Markup.keyboard([
      [productsBtn],
      [datesBtn],
      [contactsBtn]
    ]).resize()
  );
}

function getDatesMsg(rows) {
  return rows
  .map(row => `${row['Дата']} - ${row['Птица']}`)
  .join('\n');
}

function getProductsMsg(rows) {
  return rows
  .map(row => `${row.name} - цена ${row.price} руб.`)
  .join('\n');
}

function getWelcomeMsg() {
  return `
Здравствуйте! Мы кармаскалинский инкубатор. 🐥

Продаем птицу, корм и другие товары для выращивания птицы.

Здесь вы можете посмотреть наш текущий ассортимент, цены, график выводов и наши контакты.

У нас есть еще один инкубатор в Учалах. Его контакты можете найти в разделе "Контакты".

Мы продаем в розницу и в опт. По вопросам звоните на один из наших телефонов. 📞
`
}

bot.launch();
