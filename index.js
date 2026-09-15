require('dotenv').config();
const cron = require('node-cron');
const createBot = require('./bot');
const storage = require('./storage');
const { scrapeProduct } = require('./scraper');

const TOKEN = process.env.BOT_TOKEN;
if (!TOKEN) {
  console.error('❌ Please set BOT_TOKEN in your .env file.');
  process.exit(1);
}

const bot = createBot(TOKEN);

bot
  .launch()
  .then(() => console.log('✅ Bot is running'))
  .catch((e) => console.error('Bot launch error:', e.message));

const CRON_SCHEDULE = process.env.CHECK_CRON || '0 */6 * * *'; // every 6 hours by default

cron.schedule(CRON_SCHEDULE, async () => {
  console.log('🔍 Checking prices...');
  const all = storage.getAllItems();
  for (const { chatId, item } of all) {
    try {
      const product = await scrapeProduct(item.url);
      if (product.price && product.price !== item.lastPrice) {
        const dropped = product.price < item.lastPrice;
        const oldPrice = item.lastPrice;
        storage.updatePrice(chatId, item.id, product.price);
        if (dropped) {
          await bot.telegram.sendMessage(
            chatId,
            `🔻 Price dropped!\n\n📦 ${item.title}\nOld price: ₹${oldPrice}\nNew price: ₹${product.price}\n\n${item.url}`
          );
        }
      }
    } catch (e) {
      console.error('Error checking:', item.url, e.message);
    }
    // small delay between requests to avoid getting blocked
    await new Promise((r) => setTimeout(r, 3000));
  }
  console.log('✅ Check complete');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
