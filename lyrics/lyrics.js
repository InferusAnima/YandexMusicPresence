let lrc;

fetch('main.lrc').then(async (resp) => {
  lrc = await resp.text();

  showLRC(
    createLrcObj(lrc),
    'mediaAudio',
    'lrcP',
    'lrcN',
    'ArProgress',
    'lrcTime'
  );
});

const seek = (e) => {
  if (e.srcElement.seeking || e.srcElement.seeked) {
    console.log('seek');
    createLrcObj(lrc);
  }
};

document.getElementById('mediaAudio').ontimeupdate = seek;

const logProgress = (progress) => {
  console.log(progress);
};
