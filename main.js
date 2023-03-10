let fs = require('fs'),
  path = require('path'),
  win;

const dotenv = require('dotenv');
dotenv.config();

const configPath =
  process.env.NODE_ENV === 'development'
    ? path.join(__dirname, '/config.json')
    : path.join(process.execPath, '../config.json');
const config = require(configPath);

const DiscordRPC = require('discord-rpc'),
  rpc = new DiscordRPC.Client({ transport: 'ipc' }),
  { app, BrowserWindow, ipcMain } = require('electron');
DiscordRPC.register(config.clientId);

const stylesPath =
  process.env.NODE_ENV === 'development'
    ? path.join(__dirname, 'styles/styles.css')
    : path.join(process.resourcesPath, 'styles/styles.css');
const styles = fs.readFileSync(stylesPath, 'utf-8', () => {});

app.on('ready', () => {
  win = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 300,
    minHeight: 300,
    title: require('./package.json').name,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '/preload.js'),
    },
    resizable: true,
  });
  win.setMenuBarVisibility(false);

  win.on('page-title-updated', function (e) {
    e.preventDefault();
    if (config.style) {
      win.webContents.insertCSS(styles);
    }
  });

  win.once('ready-to-show', () => {
    win.show();
  });

  win.on('closed', () => {
    win = null;
  });

  win.loadURL(`https://${config.source}`);

  if (config.style) {
    win.webContents.insertCSS(styles);
  }
});

app.on('window-all-closed', () => {
  rpc.destroy();
  app.quit();
});

function setActivity() {
  if (!rpc || !win) return;

  yandex();
}

let just_run;

ipcMain.handle('track_switched', async (event, data) => {
  return new Promise(async function (resolve, reject) {
    await yandex(data);
    resolve(`track_switched: ${data.title}`);
    just_run = true;
  });
});

ipcMain.handle('track_playing', async (event, state) => {
  return new Promise(async function (resolve, reject) {
    await yandex();
    resolve(`track_playing: ${state}`);
    just_run = true;
  });
});

async function yandex(data) {
  if (just_run) {
    just_run = false;
    return;
  }

  if (!data) {
    data = await win.webContents.executeJavaScript(
      'externalAPI.getCurrentTrack()'
    );
  }
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

  if (state) {
    rpc.setActivity({
      details: data.title,
      state: data.artists.map((f) => f.title).join(', '),
      largeImageKey: 'https://' + data.cover.replace('%%', '400x400'),
      largeImageText: 'YandexMusic',
      smallImageKey: 'og-image',
      startTimestamp: startTimestamp,
      endTimestamp: endTimestamp,
      buttons: [
        {
          label: 'Go to the track',
          url: `https://${config.source}${data.link}`,
        },
      ],
    });
  }
}

rpc.on('ready', () => {
  console.log('Authed for user', rpc.user.username);

  win.webContents.executeJavaScript(
    'externalAPI.on(externalAPI.EVENT_TRACK, async () => console.log(await api.invoke("track_switched", externalAPI.getCurrentTrack())));'
  );

  win.webContents.executeJavaScript(
    'externalAPI.on(externalAPI.EVENT_STATE, async () => console.log(await api.invoke("track_playing", externalAPI.isPlaying())));'
  );

  setInterval(() => setActivity(), 5e3);
});

rpc.login({ clientId: config.clientId }).catch(console.error);
