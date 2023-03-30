let lrc;
let track_progress = 0;
let track_duration = 0;
let sign;

const seek = (e) => {
  if (e.srcElement.seeking || e.srcElement.seeked) {
    createLrcObj(lrc);
  }
};

const logProgress = (progress, duration) => {
  if (progress != 0) {
    track_progress = progress;
    track_duration = duration;
  }
};

const seekProgress = (progress, duration) => {
  if (progress != 0) {
    track_progress = progress;
    track_duration = duration;
    createLrcObj(lrc);
  }
};

// const DEFAULT_SIGN_KEY = 'p93jhgh689SBReK6ghtw62';

// const getSign = (id) => {
//   const timestamp = Date.now().toString().slice(0, -3);
//   const message = `${id}${timestamp}`;

//   const hash = CryptoJS.HmacSHA256(message, DEFAULT_SIGN_KEY);
//   const words = CryptoJS.enc.Utf8.parse(hash);
//   const sign = CryptoJS.enc.Base64.stringify(words);

//   console.log(sign);
//   return { sign: sign, timestamp: timestamp };
// };

const fetchTrack = (id) => {
  return new Promise(function (resolve, reject) {
    fetch('https://api.music.yandex.net/tracks', {
      method: 'POST',
      withCredentials: true,
      credentials: 'include',
      headers: {
        'Host': 'api.music.yandex.net',
        'User-Agent': 'Yandex-Music-API',
        'X-Yandex-Music-Client': 'YandexMusicAndroid/23020251',
        'Authorization':
          'OAuth y0_AgAAAAALr8LkAAG8XgAAAADfRQWjhOxPpP5SSPKVfTdvFrZjXqrGf64',
      },
      body: new URLSearchParams({
        'with-positions': 'True',
        'track-ids': id,
      }),
    })
      .then((res) => res.json())
      .then(
        (result) => {
          if (result.result[0].lyricsInfo.hasAvailableSyncLyrics) {
            fetchLyrics(id).then(
              (lyrics) => {
                resolve({ synced: true, url: lyrics });
              },
              (error) => {
                reject(`Error: ${error}`);
              }
            );
          } else if (result.result[0].lyricsInfo.hasAvailableTextLyrics) {
            fetchLyrics(id, 'TEXT').then(
              (lyrics) => {
                resolve({ synced: false, url: lyrics });
              },
              (error) => {
                reject(`Error: ${error}`);
              }
            );
          } else {
            reject('No lyrics');
          }
        },
        (error) => {
          reject(`Error: ${error}`);
        }
      );
  });
};

const fetchLyrics = (id, format = 'LRC') => {
  return new Promise(function (resolve, reject) {
    // const sign = getSign(id);
    fetch(
      `https://api.music.yandex.net/tracks/${id}/lyrics?format=${format}&timeStamp=${sign.timestamp}&sign=${sign.sign}`,
      {
        withCredentials: true,
        credentials: 'include',
        headers: new Headers({
          'Host': 'api.music.yandex.net',
          'User-Agent': 'Yandex-Music-API',
          'X-Yandex-Music-Client': 'YandexMusicAndroid/23020251',
          'Authorization':
            'OAuth y0_AgAAAAALr8LkAAG8XgAAAADfRQWjhOxPpP5SSPKVfTdvFrZjXqrGf64',
        }),
      }
    )
      .then((res) => res.json())
      .then(
        (result) => {
          console.log(result);
          resolve(result.result.downloadUrl);
        },
        (error) => {
          reject(`Error: ${error}`);
        }
      );
  });
};

const logState = (track_id, data) => {
  sign = data;
  fetchTrack(track_id).then(
    (data) => {
      fetch(data.url)
        .then((result) => result.text())
        .then((lyrics) => {
          if (data.synced) {
            lrc = lyrics;
            console.log(lrc);
            showLRC(createLrcObj(lrc), 'lrcP', 'lrcN', 'ArProgress', 'lrcTime');
          }
        });
    },
    (error) => {
      console.log(error);
    }
  );
};
