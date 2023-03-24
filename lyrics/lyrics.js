let lrc;
let track_progress = 0;
let track_duration = 0;

const seek = (e) => {
  if (e.srcElement.seeking || e.srcElement.seeked) {
    console.log('seek');
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

const logState = (title) => {
  fetch('main.lrc').then(async (resp) => {
    lrc = await resp.text();

    showLRC(createLrcObj(lrc), 'lrcP', 'lrcN', 'ArProgress', 'lrcTime');
  });
};
