var oLRC = {
  ti: '',
  ar: '',
  al: '',
  by: '',
  offset: 0,
  ms: [],
};

function showLRC(lrc, lrcAni, lrcN, progress, currentTime) {
  var currentTimeElem = document.getElementById(currentTime);
  var lrcAniElem = document.getElementById(lrcAni);
  var lrcNElem = document.getElementById(lrcN);

  var nowTime = track_progress;
  document.getElementById(progress).style.width =
    (nowTime / track_duration) * 100 + '%';
  var lrcJson = lrc.ms;
  for (i1 = 0; i1 < lrcJson.length; i1++) {
    currentTimeElem.innerHTML = `${nowTime.toFixed(2)} 
    / ${track_duration.toFixed(2)}`;
    var info1 = nowTime >= lrcJson[i1].t - 0.5;
    if (info1) {
      currentTimeElem.innerHTML = lrcJson[i1].t;
      if (lrcJson[i1].c == '') {
        lrcAniElem.innerHTML = `<small class="lrcani text-primary"><i>...</i></small>`;
      } else {
        lrcAniElem.innerHTML = `<span class="lrcani">${lrcJson[i1].c}</span>`;
        if (i1 + 2 < lrcJson.length) {
          lrcNElem.innerHTML = `${lrcJson[i1 + 1].c}<br>${lrcJson[i1 + 2].c}`;
        } else {
          lrcNElem.innerHTML = `END`;
        }
      }
      console.log(lrcJson[i1].c);
      lrcJson.splice(i1, 1);
    }
  }
  requestAnimationFrame(() => {
    showLRC(lrc, lrcAni, lrcN, progress, currentTime);
  });
}

function createLrcObj(lrc) {
  oLRC.ms = [];
  if (lrc.length == 0) return;
  var lrcs = lrc.split('\n');
  for (var i in lrcs) {
    lrcs[i] = lrcs[i].replace(/(^\s*)|(\s*$)/g, '');
    var t = lrcs[i].substring(lrcs[i].indexOf('[') + 1, lrcs[i].indexOf(']'));
    var s = t.split(':');
    if (isNaN(parseInt(s[0]))) {
      for (var i in oLRC) {
        if (i != 'ms' && i == s[0].toLowerCase()) {
          oLRC[i] = s[1];
        }
      }
    } else {
      var arr = lrcs[i].match(/\[(\d+:.+?)\]/g);
      var start = 0;
      for (var k in arr) {
        start += arr[k].length;
      }
      var content = lrcs[i].substring(start);
      for (var k in arr) {
        var t = arr[k].substring(1, arr[k].length - 1);
        var s = t.split(':');
        oLRC.ms.push({
          t: parseFloat(s[0]) * 60 + parseFloat(s[1]),
          c: content,
        });
      }
    }
  }
  oLRC.ms.sort(function (a, b) {
    return a.t - b.t;
  });
  return oLRC;
}
