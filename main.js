let config = require('./config.json'),
  win;

const DiscordRPC = require('discord-rpc'),
  rpc = new DiscordRPC.Client({ transport: 'ipc' }),
  { app, BrowserWindow } = require('electron');
DiscordRPC.register(config.clientId);

app.on('ready', () => {
  win = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 300,
    minHeight: 300,
    title: require('./package.json').name,
    show: false,
    webPreferences: { nodeIntegration: false },
    resizable: true,
  });
  win.setMenuBarVisibility(false);

  win.on('page-title-updated', function (e) {
    e.preventDefault();
  });

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
