const { Telegraf } = require('telegraf');
const { scrapeProduct, detectSite } = require('./scraper');
const storage = require('./storage');
const { buildChartUrl } = require('./chart');

function createBot(token) {
  const bot = new Telegraf(token);

  async function handleTrack(ctx, url) {
    const site = detectSite(url);
    if (!site) {
      return ctx.reply('Only Amazon or Flipkart links are supported.');
    }
    try {
      await ctx.reply('⏳ Checking price...');
      const product = await scrapeProduct(url);
      if (!product.price) {
        return ctx.reply(
          "Sorry, I couldn't fetch the price. Please try again later or check the link."
        );
      }
      const item = storage.addItem(String(ctx.chat.id), {
        url,
        site,
        title: product.title || url,
        firstPrice: product.price,
        lastPrice: product.price,
        lastChecked: Date.now(),
      });
      await ctx.reply(
        `✅ Tracking started!\n\n📦 ${item.title}\n💰 Current price: ₹${item.lastPrice}\n🆔 ID: ${item.id}\n\nYou'll get a notification here if the price drops.`
      );
    } catch (e) {
      console.error('track error:', e.message);
      await ctx.reply("Sorry, something went wrong fetching the price for this link.");
    }
  }

  bot.start((ctx) =>
    ctx.reply(
      "Welcome! 👋\n\nSend me an Amazon or Flipkart product link and I'll start tracking its price, and notify you if it drops.\n\n📌 Commands:\n/track <link> - start tracking\n/list - see tracked products\n/chart <id> - price history graph\n/untrack <id> - stop tracking"
    )
  );

  bot.help((ctx) =>
    ctx.reply('/track <link>\n/list\n/chart <id>\n/untrack <id>\n\nOr just send a link directly and tracking will start automatically.')
  );

  bot.command('track', (ctx) => {
    const url = ctx.message.text.split(' ').slice(1).join(' ').trim();
    if (!url) return ctx.reply('Please provide a link, e.g.: /track https://www.amazon.in/dp/XXXXXXX');
    return handleTrack(ctx, url);
  });

  bot.command('list', (ctx) => {
    const items = storage.getItems(String(ctx.chat.id));
    if (!items.length) return ctx.reply('No products are being tracked yet.');
    const text = items
      .map(
        (i) =>
          `🆔 ${i.id} | ${i.site.toUpperCase()}\n📦 ${i.title}\n💰 Current: ₹${i.lastPrice} (Started at: ₹${i.firstPrice})`
      )
      .join('\n\n');
    ctx.reply(text + '\n\n📊 See chart: /chart <id>');
  });

  bot.command('chart', async (ctx) => {
    const id = ctx.message.text.split(' ')[1];
    if (!id) return ctx.reply('Please provide an ID: /chart <id> (get the ID from /list)');
    const items = storage.getItems(String(ctx.chat.id));
    const item = items.find((i) => i.id === id);
    if (!item) return ctx.reply('❌ This ID was not found.');
    if (!item.priceHistory || item.priceHistory.length < 2) {
      return ctx.reply("Not enough data yet — please try again after a few price checks have run.");
    }
    try {
      const url = buildChartUrl(item);
      await ctx.replyWithPhoto(
        { url },
        { caption: `📊 ${item.title}\n💰 Current price: ₹${item.lastPrice}` }
      );
    } catch (e) {
      console.error('chart error:', e.message);
      ctx.reply('Sorry, something went wrong generating the chart.');
    }
  });

  bot.command('untrack', (ctx) => {
    const id = ctx.message.text.split(' ')[1];
    if (!id) return ctx.reply('Please provide an ID: /untrack <id> (get the ID from /list)');
    const ok = storage.removeItem(String(ctx.chat.id), id);
    ctx.reply(ok ? '✅ Tracking stopped.' : '❌ This ID was not found.');
  });

  // If the user just sends a link (no command), start tracking automatically
  bot.on('text', (ctx) => {
    const text = ctx.message.text.trim();
    if (text.startsWith('/')) return;
    if (detectSite(text)) return handleTrack(ctx, text);
  });

  return bot;
}

module.exports = createBot;
