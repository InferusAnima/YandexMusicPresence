let fs = require('fs'),
  config = require('./config.json'),
  saveConfig = () => {
    fs.writeFile('./config.json', JSON.stringify(config), 'utf8', () => {});
  },
  win;

const DiscordRPC = require('discord-rpc'),
  rpc = new DiscordRPC.Client({ transport: 'ipc' }),
  { app, BrowserWindow, Menu } = require('electron');
DiscordRPC.register(config.clientId);

app.on('ready', () => {
  win = new BrowserWindow({
    width: 800,
    height: 700,
    minWidth: 300,
    minHeight: 300,
    show: false,
    webPreferences: { nodeIntegration: false },
    resizable: true,
  });
  win.removeMenu();

  win.once('ready-to-show', () => {
    win.show();
  });

  win.on('closed', () => {
    win = null;
  });
  win.loadURL(`https://${config.source}`);
});

app.on('window-all-closed', () => {
  rpc.destroy();
  app.quit();
});

function setActivity() {
  if (!rpc || !win) return;

  if (config.source.indexOf('music.yandex.ru') != -1) {
    yandex();
    return;
  }
}

async function yandex() {
  let data = await win.webContents.executeJavaScript(
    'externalAPI.getCurrentTrack()'
  );
  let state = await win.webContents.executeJavaScript(
    'externalAPI.isPlaying()'
  );
  let progress = await win.webContents.executeJavaScript(
    'externalAPI.getProgress()'
  );

  if (!state) {
    rpc.clearActivity();
    return;
  }

  const startTimestamp = new Date();
  const endTimestamp = new Date(
    startTimestamp.getTime() + (data.duration - progress.position) * 1000
  );

  rpc.setActivity({
    details: data.title,
    state: data.artists.map((f) => f.title).join(', '),
    largeImageKey: 'https://' + data.cover.replace('%%', '400x400'),
    largeImageText: 'YandexMusic',
    smallImageKey: 'og-image',
    startTimestamp: startTimestamp,
    endTimestamp: endTimestamp,
    buttons: [
      { label: 'Go to the track', url: `https://${config.source}${data.link}` },
    ],
  });
}

rpc.on('ready', () => {
  console.log('Authed for user', rpc.user.username);

  setInterval(() => setActivity(), 5e3);
});

rpc.login({ clientId: config.clientId }).catch(console.error);
