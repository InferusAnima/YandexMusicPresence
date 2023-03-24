let btnLyricsElem;

if (!btnLyricsElem) {
  document.querySelector(
    'body > div.page-root.page-root_no-player.deco-pane-back.theme.theme_dark.black > div.bar > div.bar__content > div.player-controls.deco-player-controls > div.player-controls__track-container'
  ).style.marginLeft = '260px';

  btnLyricsElem = document
    .querySelector(
      'body > div.page-root.page-root_no-player.deco-pane-back.theme.theme_dark.black > div.bar > div.bar__content > div.player-controls.deco-player-controls > div.player-controls__btn.deco-player-controls__button.player-controls__btn_seq'
    )
    .cloneNode(true);
  btnLyricsElem.style.marginLeft = '0px';
  btnLyricsElem.style.scale = '70%';
  btnLyricsElem.title = 'Текст песни';
  const image =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAB0UlEQVR4nMWXTSsFURjHx8vGVaSrkJRP4O0uyIKNyAewuhsSllhbYKMU2UuyZeNaEZGFuhvytrBCWCJEIS8/ne5DJx0zw5wZ//rXnWeeec5vbuc854zjWBYwA/QDebZr+xKwRkYXQKffh3aBkwAuMAB8ahEo8gK4IZiKDABp4EV+qxeMuwE0Ay0BnGsA6AUagSu53tLzQhMagFxXA/cSG4ocQAnokditPl++BAwD4wGc5wGQLZNVqSuqSdj7bYwJic+ZAKaA6QCO+QDolviqE6bwBtj4L4Axic+aHqoGEgGc4wNgXeKDkU9CMqvgTuL1JoBTgfirCz0ASjXYn1uyDf0AENcAyiIHUAKOJD7i/PMyfJdDSyxSAK3hKV3qKycyALnfalyKvxHQJL09BSwBkyrmByCQgApg06UfqGazHwoAUA6cSfFXYB4YEC8Ab99grAOkpPAxUGe4n9D2fLsAQKUsH+Val7yE5FgH6JCi+z5yD8MASErRtI9cdRxXStoEqJOiT0CJS57adJ4lt8YmQBZwIIWXTW0UyAdWJGfP2uCfko8M9Q8onQN9QJW4T2JKj0CDE4aAduDapRGpr6C2UAbXIIqBUWAHeBBvq232L4eND8LVjuqPZDJnAAAAAElFTkSuQmCC';
  btnLyricsElem.firstChild.style.backgroundImage = `url("${image}")`;

  btnLyricsElem.onclick = async () =>
    console.log(
      await api.invoke('lyrics_click', externalAPI.getCurrentTrack())
    );

  document
    .querySelector(
      'body > div.page-root.page-root_no-player.deco-pane-back.theme.theme_dark.black > div.bar > div.bar__content > div.player-controls.deco-player-controls'
    )
    .appendChild(btnLyricsElem);
}
