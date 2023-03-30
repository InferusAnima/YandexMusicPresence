let fs = require('fs'),
  path = require('path'),
  win,
  winLyrics;

const dotenv = require('dotenv');
dotenv.config();

const isDev = process.env.NODE_ENV === 'development';

const configPath = isDev
  ? path.join(__dirname, '/config.json')
  : path.join(process.execPath, '../config.json');
const config = require(configPath);

const DiscordRPC = require('discord-rpc'),
  rpc = new DiscordRPC.Client({ transport: 'ipc' }),
  { app, BrowserWindow, ipcMain } = require('electron');
DiscordRPC.register(config.clientId);

const stylesPath = isDev
  ? path.join(__dirname, 'styles/styles.css')
  : path.join(process.resourcesPath, 'styles/styles.css');
const styles = fs.readFileSync(stylesPath, 'utf-8', () => {});

const btnLyricsPath = isDev
  ? path.join(__dirname, 'lyrics/btnLyrics.js')
  : path.join(process.resourcesPath, 'lyrics/btnLyrics.js');
const btnLyrics = fs.readFileSync(btnLyricsPath, 'utf-8', () => {});

const signPath = isDev
  ? path.join(__dirname, 'lyrics/sign.py')
  : path.join(process.resourcesPath, 'lyrics/sign.py');

const { PythonShell } = require('python-shell');

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

  win.webContents.on('did-finish-load', function () {
    win.webContents.executeJavaScript(btnLyrics);
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
    if (winLyrics) {
      winLyrics.webContents.executeJavaScript(`logState('${data.link}');`);
    }
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

ipcMain.handle('track_progress', async (event, progress) => {
  return new Promise(async function (resolve, reject) {
    if (winLyrics) {
      winLyrics.webContents.executeJavaScript(
        `logProgress(${progress.position}, ${progress.duration});`
      );
    }
    resolve(`track_progress: ${progress}`);
  });
});

ipcMain.handle('track_seek', async (event, progress) => {
  return new Promise(async function (resolve, reject) {
    if (winLyrics) {
      winLyrics.webContents.executeJavaScript(
        `seekProgress(${progress.position}, ${progress.duration});`
      );
    }
    resolve(`track_seek: ${progress.position}`);
  });
});

const createLyricsWin = () => {
  winLyrics = new BrowserWindow({
    width: 400,
    height: 700,
    minWidth: 400,
    minHeight: 700,
    maxHeight: 700,
    title: require('./package.json').name,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '/preload.js'),
    },
    resizable: true,
    maximizable: false,
  });
  winLyrics.setMenuBarVisibility(false);

  winLyrics.webContents.session.webRequest.onBeforeSendHeaders(
    (details, callback) => {
      if (details.url.includes('api.music.yandex.net')) {
        callback({
          requestHeaders: { Origin: '*', ...details.requestHeaders },
        });
      } else {
        callback({ requestHeaders: { ...details.requestHeaders } });
      }
    }
  );

  winLyrics.webContents.session.webRequest.onHeadersReceived(
    (details, callback) => {
      if (details.url.includes('api.music.yandex.net')) {
        callback({
          responseHeaders: {
            'Access-Control-Allow-Origin': ['*'],
            ...details.responseHeaders,
          },
        });
      } else {
        callback({ responseHeaders: { ...details.responseHeaders } });
      }
    }
  );

  winLyrics.on('closed', () => {
    winLyrics = null;
  });
};

ipcMain.handle('lyrics_click', async (event, data) => {
  return new Promise(async function (resolve, reject) {
    if (!winLyrics) {
      createLyricsWin();

      winLyrics.webContents.on('did-finish-load', function () {
        const track_id = data.link.split('/').slice(-1);
        PythonShell.run(
          signPath,
          { args: [track_id] },
          function (err, results) {
            if (err) throw err;
          }
        ).then((sign) => {
          winLyrics.webContents.executeJavaScript(
            `logState('${track_id}', ${sign[0]});`
          );
        });
      });
    }

    if (winLyrics.isVisible()) {
      winLyrics.close();
    } else {
      winLyrics.show();

      const lyricsUrl = isDev
        ? path.join(__dirname, 'lyrics/lyrics.html')
        : path.join(process.resourcesPath, 'lyrics/lyrics.html');

      winLyrics.loadURL(lyricsUrl);
    }

    resolve(`lyrics_click: ${data.title}`);
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

  win.webContents.executeJavaScript(
    'externalAPI.on(externalAPI.EVENT_PROGRESS, async () => await api.invoke("track_progress", externalAPI.getProgress()));'
  );

  win.webContents.executeJavaScript(
    'document.getElementsByClassName("player-progress")[0].onclick = async () => console.log(await api.invoke("track_seek", externalAPI.getProgress()));'
  );

  setInterval(() => setActivity(), 5e3);
});

rpc.login({ clientId: config.clientId }).catch(console.error);
