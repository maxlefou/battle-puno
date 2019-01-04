/**
 * The Superclass of all scene within the game.
 * 
 * @class Scene_Base
 * @constructor 
 * @extends Stage
 * @property {boolean} _active      - acitve flag
 * @property {number}  _fadingFlag  - fade type flag
 * @property {number}  _fadingTimer - timer of fade effect
 * @property {Sprite}  _fadeSprite  - sprite of fade effect
 */
class Scene_Base extends Stage{
  /**-------------------------------------------------------------------------
   * @constructor
   * @memberof Scene_Base
   */
  constructor(){
    super();
    this._active  = false;
    this._windows = [];
    this._fadingFlag = 0;
    this._fadingTimer = 0;
    this._buttonCooldown = new Array(0xff);
    this._fadingSprite = Graphics.fadingSprite;
  }
  /**-------------------------------------------------------------------------
   * > Frame update
   * @memberof Scene_Base
   */
  update(){
    this.updateFading();
    this.updateChildren();
  }
  /*-------------------------------------------------------------------------*/
  updateChildren(){
    this.children.forEach(function(child){
      if(child.update){
        if(!this.overlay || !child.isWindow || child === this.overlay){
          child.update();
        }
      }
    }.bind(this))
  }
  /**-------------------------------------------------------------------------
   * @returns {boolean} - whether scene is fading
   */
  isBusy(){
    return this._fadingTimer > 0;
  }
  /*-------------------------------------------------------------------------*/
  preTerminate(){
    debug_log("Scene pre-terminate: " + getClassName(this));
    this.startFadeOut();
    this.deactivateChildren();
  }
  /*-------------------------------------------------------------------------*/
  terminate(){
    debug_log("Scene terminated: " + getClassName(this));
    this.disposeAllWindows();
  }
  /**-------------------------------------------------------------------------
   * > Create the components and add them to the rendering process.
   */
  create(){
    this.createBackground();
  }
  /**-------------------------------------------------------------------------
   * Deactivate all sprites to prevent interaction during terminating
   */
  deactivateChildren(){
    this.children.forEach(function(sp){
      sp.deactivate();
    })
  }
  /**-------------------------------------------------------------------------
   * > Remove windows from page
   */
  disposeAllWindows(){
    for(let i=0;i<this._windows.length;++i){
      this.disposeWindowAt(i);
    }
    this._windows = [];
  }
  /**-------------------------------------------------------------------------
   * > Remove a single window
   */
  removeWindow(win){
    this.disposeWindowAt(this._windows.indexOf(win));
  }
  /**-------------------------------------------------------------------------
   * > Dispose window
   */
  disposeWindowAt(index){
    if(index <= -1){
      console.error("Trying to dispose the window not rendered yet")
      return ;
    }
    debug_log("Dispose window: " + getClassName(this._windows[index]));
    this._windows[index].clear(true);
    this._windows.splice(index, 1);
  }
  /**-------------------------------------------------------------------------
   * > Create background
   */
  createBackground(){
    // reserved for inherited class
  }
  /**-------------------------------------------------------------------------
   * @returns {boolean} - whether current scene is active
   */
  isActive(){
    return this._active;
  }
  /*-------------------------------------------------------------------------*/
  start(){
    this._active = true;
    this._fadingSprite = Graphics.fadingSprite;
    if(DebugMode){this.addChild(Graphics.FPSSprite)}
    this.renderGlobalSprites();
    this.renderGlobalWindows();
  }
  /*-------------------------------------------------------------------------*/
  stop(){
    this._active = false;
  }
  /*-------------------------------------------------------------------------*/
  renderGlobalSprites(){
    Graphics.globalSprites.forEach(function(sp){
      Graphics.renderSprite(sp);
      if(sp.defaultActiveState){sp.activate(); sp.show();}
    });
  }
  /*-------------------------------------------------------------------------*/
  renderGlobalWindows(){
    Graphics.globalWindows.forEach(function(win){
      Graphics.renderWindow(win);
      if(win.defaultActiveState){win.activate(); win.show();}
    });
  }
  /*-------------------------------------------------------------------------*/
  startFadeIn(duration){
    Graphics.renderSprite(Graphics.fadingSprite);
    this._fadingSprite.show();
    this._fadeSign = 1;
    this._fadingTimer = duration || 30;
    this._fadingSprite.setOpacity(1);
  }
  /*-------------------------------------------------------------------------*/
  startFadeOut(duration){
    Graphics.renderSprite(Graphics.fadingSprite);
    this._fadingSprite.show();
    this._fadeSign = -1;
    this._fadingTimer = duration || 30;
    this._fadingSprite.setOpacity(0);
  }
  /*-------------------------------------------------------------------------*/
  updateFading(){
    if(this._fadingTimer <= 0){return ;}
    let d = this._fadingTimer;
    let opa = this._fadingSprite.opacity;
    if(this._fadeSign > 0){
      this._fadingSprite.setOpacity(opa - opa / d)
    }
    else{
      this._fadingSprite.setOpacity(opa + (1 - opa) / d)
    }
    this._fadingTimer -= 1;
    if(this._fadingTimer <= 0){this.onFadeComplete();}
  }
  /**-------------------------------------------------------------------------
   * > Fade out screen and sound
   */
  fadeOutAll(){
    var time = this.slowFadeSpeed() / 60;
    Sound.fadeOutBGM(time);
    Sound.fadeOutSE(time);
    this.startFadeOut(this.slowFadeSpeed());
  }
  /*-------------------------------------------------------------------------*/
  onFadeComplete(){
    this._fadingFlag  = 0;
    this._fadingTimer = 0;
  }
  /**-------------------------------------------------------------------------
   * @returns {number} - frames before fade completed, slower one
   */
  slowFadeSpeed(){
    return this.fadeSpeed() * 2;
  }
  /**-------------------------------------------------------------------------
   * @returns {number} - frames before fade completed
   */
  fadeSpeed(){
    return 24;
  }
  /**-------------------------------------------------------------------------
   * @returns {boolean} - Graphics is loaded and ready
   */
  isReady(){
    return Graphics.isReady();
  }
  /**-------------------------------------------------------------------------
   * > Add window to page view
   * @param {Window_Base} win - the window class
   */
  addWindow(win, forced = false){
    if(!this.isActive() && !forced){
      console.error("Trying to add window to stopped scene")
      return ;
    }
    if(win.isDisposed()){
      console.error("Try to add disposed window: " + getClassName(win));
      return ;
    }
    this._windows.push(win);
    this.addChild(win);
  }
  /**-------------------------------------------------------------------------
   * > Pause animate sprites
   */
  pause(){
    this.children.forEach(function(sp){
      Graphics.pauseAnimatedSprite(sp);
      if(sp.isActive()){sp.lastActiveState = sp.isActive();}
      sp.deactivate();
    })
  }
  /**-------------------------------------------------------------------------
   * > Resume paused animate sprites
   */
  resume(){
    this.children.forEach(function(sp){
      Graphics.resumeAnimatedSprite(sp);
      if(sp.lastActiveState){
        sp.activate();
      }
    })
  }
  /*-------------------------------------------------------------------------*/
  heatupButton(kid){
    this._buttonCooldown[kid] = 4;
  }
  /*-------------------------------------------------------------------------*/
  isButtonCooled(kid){
    return (this._buttonCooldown[kid] || 0) == 0;
  }
  /*-------------------------------------------------------------------------*/
  raiseOverlay(ovs){
    if(!ovs){return ;}
    debug_log("Raise overlay: " + getClassName(ovs));
    this.overlay = ovs;
    this.overlay.oriZ = ovs.z;
    this.overlay.setZ(0x111);
    this.children.forEach(function(sp){
      if(sp.alwaysActive){return ;}
      if(sp !== ovs){
        sp.lastActiveState = sp.isActive();
        sp.deactivate();
      }
    })
    Graphics.renderSprite(Graphics.dimSprite);
    ovs.show(); ovs.activate();
  }
  /*-------------------------------------------------------------------------*/
  closeOverlay(){
    if(!this.overlay){return ;}
    debug_log("Close overlay");
    this.overlay.hide(); this.overlay.deactivate();
    this.children.forEach(function(sp){
      if(sp !== this.overlay && sp.lastActiveState){
        sp.activate();
      }
    }.bind(this))
    Graphics.removeSprite(Graphics.dimSprite);
    this.overlay.setZ(this.overlay.oriZ);
    this.overlay = null;
  }
  /*-------------------------------------------------------------------------*/
} // Scene_Base

/**
 * > The scene that shows the load process
 * 
 * @class Scene_Load
 * @extends Scene_Base
 * @property {number} loading_timer - timer record of loading phase
 */
class Scene_Load extends Scene_Base{
  /**-------------------------------------------------------------------------
   * @constructor
   * @memberof Scene_Load
   * @property {boolean} allLoaded - Graphics and Audio are both loaded
   */
  constructor(){
    super()
    this.allLoaded = false;
    this.loading_timer = 0;
  }
  /**-------------------------------------------------------------------------
   * > Start processing
   */
  start(){
    super.start();
    this.processLoadingPhase();
    let bitset = DataManager.getSetting('hideWarning');
    if(validNumericCount(null, bitset) != 1){bitset = 0;}
    let newSetting = 0;

    if(isMobile){
      if(!(bitset & 1)){
        let b = window.confirm(Vocab["MobileWarning"] + '\n' + Vocab["DontShowWarning"])
        newSetting |= (b + 0)
      }else{newSetting |= 1;}
    }

    if(!isChrome && !isFirefox && !isSafari){
      if(!(bitset & 2)){
        let b = window.confirm(Vocab["BrowserWarning"]+ '\n' + Vocab["DontShowWarning"])
        newSetting |= ((b + 0) << 1);
      }else{newSetting |= (1 << 1);}
    }

    if(isFirefox){
      if(!(bitset & 4)){
        let b = window.confirm(Vocab["FirefoxWarning"]+ '\n' + Vocab["DontShowWarning"])
        newSetting |= ((b+0) << 2);
      }else{newSetting |= (1 << 2);}
    }

    DataManager.changeSetting('hideWarning', newSetting);
  }
  /**-------------------------------------------------------------------------
   * @returns {boolean}
   */
  isReady(){
    return Graphics._loaderReady;
  }
  /*-------------------------------------------------------------------------*/
  create(){
    super.create();
    this.createLoadingImage();
    this.createLoadingText();
    this.createProgressBar();
  }
  /*-------------------------------------------------------------------------*/
  update(){
    super.update();
    this.updateLoading();
    this.updateButtonCooldown();
    this.updateProgressBar();
  }
  /*-------------------------------------------------------------------------*/
  createProgressBar(){
    let dw = Graphics.width * 0.3;
    let dh = 24;
    let dx = Graphics.appCenterWidth(dw), dy = this.load_text.y + 36;
    this.bar = new Sprite_ProgressBar(dx, dy, dw, dh);
    this.bar.setMaxProgress(Graphics.getLoadingProgress[1] + Sound.getLoadingProgress[1]);
  }
  /*-------------------------------------------------------------------------*/
  createLoadingImage(){
    this.loading_sprite = Graphics.addSprite(Graphics.LoadImage);
    let sx = Graphics.appCenterWidth(this.loading_sprite.width);;
    let sy = Graphics.appCenterHeight(this.loading_sprite.height);
    this.loading_sprite.setPOS(sx, sy);
    this.loading_sprite.anchor.set(0.5);
  }
  /*-------------------------------------------------------------------------*/
  createLoadingText(){
    this.load_text = Graphics.addText(Vocab.LoadText);
    let lt = this.load_text, ls = this.loading_sprite;
    let offset = Graphics._spacing;
    lt.x = Graphics.appCenterWidth(lt.width);
    lt.y = Graphics.appCenterHeight(lt.height) + ls.height + offset;
  }
  /*-------------------------------------------------------------------------*/
  reportLoaderProgress(loader, resources){
    Graphics._loadProgress += 1;
    let message = 'Graphics Loaded : ' + loader.progress + '%';
    if(resources){message += ', name : ' + resources.name + ', url : ' + resources.url;}
    debug_log(message);
  }
  /*-------------------------------------------------------------------------*/
  updateButtonCooldown(){
    for(let i=0;i<0xff;++i){
      if((this._buttonCooldown[i] || 0) > 0){
        this._buttonCooldown[i] -= 1;
      }
    }
  }
  /*-------------------------------------------------------------------------*/
  updateLoading(){
    this.updateImage();
    this.updateText();
    if(this.allLoaded){
      if(this.loading_timer < 60)this.loading_timer += 1;
      if(this.loading_timer == 60){this.processLoadingComplete();}
    }
  }
  /*-------------------------------------------------------------------------*/
  updateImage(){
    let sprite = SceneManager.scene.loading_sprite;
    if(sprite.scale_flag){
      sprite.scale.x *= 0.98;
      sprite.scale.y *= 0.98;
      if(sprite.scale.x <= 0.5)sprite.scale_flag = false;
    }
    else{
      sprite.scale.x *= 1.02;
      sprite.scale.y *= 1.02;
      if(sprite.scale.x >= 1.5)sprite.scale_flag = true;
    }
  }
  /*-------------------------------------------------------------------------*/
  updateText(){
    let gr = Graphics.isReady(), sr = Sound.isReady();
    let sprite = this.load_text;
    let txt = Vocab.LoadText;
    if(gr && !sr){
      txt = Vocab.LoadTextAudio;
    }
    else if(!gr && sr){
      txt = Vocab.LoadTextGraphics;
    }
    else if(gr && sr){
      txt = Vocab.LoadTextComplete;
      this.allLoaded = true;
    }
    if(sprite.text == txt){return ;}
    sprite.text = txt;
    sprite.x = Graphics.appCenterWidth(sprite.width) - Graphics._spacing * 2;
  }
  /*-------------------------------------------------------------------------*/
  updateProgressBar(){
    this.bar.setProgress(Graphics.getLoadingProgress[0] + Sound.getLoadingProgress[0]);
  }
  /*-------------------------------------------------------------------------*/
  processLoadingPhase(){
    debug_log("Init loading phase");
    Graphics.renderSprite(this.loading_sprite);
    Graphics.renderSprite(this.load_text);
    Graphics.renderSprite(this.bar);
    Graphics.preloadAllAssets(this.reportLoaderProgress, null);
  }
  /*-------------------------------------------------------------------------*/
  processLoadingComplete(){
    debug_log("Loading Complete called");
    this.loading_timer = 0xff;
    GameStarted = true;
    Sound.playSaveLoad();
    if(TestMode){
      SceneManager.goto(Scene_Test);
    }
    else if(QuickStart){
      SceneManager.goto(Scene_Title);
    }
    else{
      SceneManager.goto(Scene_Intro);
    }
  }
  /*-------------------------------------------------------------------------*/
}
/**---------------------------------------------------------------------------
 * > The intro scene that display the splash image
 * @class Scene_Intro
 * @extends Scene_Base
 */
class Scene_Intro extends Scene_Base{
  /*-------------------------------------------------------------------------*/
  constructor(...args){
    super(...args)
  }
  /*-------------------------------------------------------------------------*/
  create(){
    super.create();
    this.createNTOUSplash();
    this.createPIXISplash();
    this.createHowlerSplash();
  }
  /*-------------------------------------------------------------------------*/
  createBackground(){
    this.backgroundImage = new PIXI.Graphics();
    this.backgroundImage.beginFill(0);
    this.backgroundImage.drawRect(0, 0, Graphics.width, Graphics.height);
    this.backgroundImage.endFill();
    Graphics.renderSprite(this.backgroundImage);
  }
  /*-------------------------------------------------------------------------*/
  start(){
    super.start();
    this.timer        = 0;
    this.fadeDuration = 30;
    this.NTOUmoment   = 150;
    this.ENDmoment    = 500;
    this.drawLibrarySplash();
    Sound.loadStageAudio();
  }
  /*-------------------------------------------------------------------------*/
  update(){
    super.update();
    this.timer += 1;
    this.updateSplashStage();
    this.updateSkip();
    if(this.requestFilterUpdate){
      this.ntouSplash.filters[0].time += 1;
    }
  }
  /*-------------------------------------------------------------------------*/
  updateSplashStage(){
    if(this.timer == this.NTOUmoment){
      this.startFadeOut();
    }
    else if(this.timer == this.NTOUmoment + this.fadeDuration){
      this.startFadeIn();
      this.processNTOUSplash();
    }
    else if(this.timer == this.NTOUmoment + this.fadeDuration + 40){
      Sound.playSE(Sound.Wave);
    }
    else if(this.timer == this.NTOUmoment + this.fadeDuration + 60){
      this.startSplashEffect();
    }
    else if(this.timer == this.ENDmoment){
      this.startFadeOut();
      Sound.fadeOutAll();
      SceneManager.goto(Scene_Title);
    }
  }
  /*-------------------------------------------------------------------------*/
  updateSkip(){
    if(!Input.isTriggered(Input.keymap.kMOUSE1)){return ;}
    this.heatupButton(Input.keymap.kMOUSE1);
    if(this.timer < this.NTOUmoment){
      this.timer = this.NTOUmoment - 1;
    }
    else if(this.timer < this.NTOUmoment + this.fadeDuration){
      this.timer = this.NTOUmoment + this.fadeDuration - 1;
    }
    else if(this.timer < this.ENDmoment){
      this.timer = this.ENDmoment - 1;
    }
  }
  /*-------------------------------------------------------------------------*/
  createPIXISplash(){
    this.pixiSplash = Graphics.addSprite(Graphics.pixiSplash);
    this.pixiSplash.setPOS(Graphics.appCenterWidth(this.pixiSplash.width));
  }
  /*-------------------------------------------------------------------------*/
  createHowlerSplash(){
    this.howlerSplash = Graphics.addSprite(Graphics.howlerSplash);
    this.howlerSplash.setPOS(Graphics.appCenterWidth(this.howlerSplash.width));
  }
  /*-------------------------------------------------------------------------*/
  createNTOUSplash(){
    this.ntouSplash = Graphics.addSprite(Graphics.ntouSplash);
    let dx = Graphics.appCenterWidth(this.ntouSplash.width);
    let dy = Graphics.appCenterHeight(this.ntouSplash.height);
    this.ntouSplash.setPOS(dx, dy);
  }
  /*-------------------------------------------------------------------------*/
  drawLibrarySplash(){
    let totalW  = this.pixiSplash.height + this.howlerSplash.height;
    let padding = Graphics.height - totalW;
    this.pixiSplash.setPOS(null, padding / 3);
    this.howlerSplash.setPOS(null, padding);
    Graphics.renderSprite(this.pixiSplash);
    Graphics.renderSprite(this.howlerSplash);
  }
  /*-------------------------------------------------------------------------*/
  terminate(){
    super.terminate();
    Graphics.createGlobalWindows();
    Graphics.createGlobalSprites();
  }
  /*-------------------------------------------------------------------------*/
  processNTOUSplash(){
    this.ntouSplash.filters = []
    Graphics.removeSprite(this.pixiSplash, this.howlerSplash);
    Graphics.renderSprite(this.ntouSplash);
  }
  /*-------------------------------------------------------------------------*/
  startSplashEffect(){
    let wave = new PIXI.filters.ShockwaveFilter([0.5, 0.5],{
      speed: 5,
      brightness: 8
    });
    this.ntouSplash.filters = [wave];
    this.requestFilterUpdate = true;
  }
  /*-------------------------------------------------------------------------*/
}
/**---------------------------------------------------------------------------
 * > The title scene
 * @class Scene_Title
 * @extends Scene_Base
 */
class Scene_Title extends Scene_Base{
  /**-------------------------------------------------------------------------
   * @constructor
   * @memberof Scene_Title
   */
  constructor(){
    super()
    this.particles = [];
    this.particleNumber = 16;
  }
  /**-------------------------------------------------------------------------
   * > Start processing
   */
  start(){
    super.start();
    Sound.fadeInBGM(Sound.Title, 500);
    Graphics.addWindow(this.menu);
    this.menu.activate();
    this.particles.forEach(function(sp){sp.render();})
  }
  /*-------------------------------------------------------------------------*/
  create(){
    super.create();
    this.createMenu();
    this.createparticles();
    this.createGameModeWindow();
    this.createGameOptionWindow();
    this.createHelpWindow();
    this.createBackButton();
    this.createDimBack();
    this.assignHandlers();
  }
  /*-------------------------------------------------------------------------*/
  assignHandlers(){
    this.gameModeWindow.setHandler(this.gameModeWindow.kTraditional, this.onGameTraditional);
    this.gameModeWindow.setHandler(this.gameModeWindow.kBattlepuno, this.onGameBattlePuno);
    this.gameModeWindow.setHandler(this.gameModeWindow.kDeathMatch, this.onGameDeathMatch);
  }
  /*-------------------------------------------------------------------------*/
  update(){
    super.update();
    this.updateparticles();
  }
  /*-------------------------------------------------------------------------*/
  updateparticles(){
    for(let i=0;i<this.particleNumber;++i){
      let sp = this.particles[i];
      sp.y -= sp.speedFactor;
      if(!(i&1)){sp.rotation += sp.rotationDelta * Graphics.speedFactor;}
      if(sp.opacity < 0.6){sp.setOpacity(sp.opacity + 0.05 * Graphics.speedFactor);}
      if(sp.y < -50){this.setParticlePosition(i);}
    }
  }
  /*-------------------------------------------------------------------------*/
  createBackground(){
    this.backgroundImage = Graphics.addSprite(Graphics.Title);
    Graphics.renderSprite(this.backgroundImage);
  }
  /*-------------------------------------------------------------------------*/
  createMenu(){
    let ww = 200, wh = 200;
    let wx = Graphics.width - ww - Graphics.padding / 2;
    let wy = Graphics.height / 2;
    this.menu = new Window_Menu(wx, wy, ww, wh);
  }
  /*-------------------------------------------------------------------------*/
  createDimBack(){
    this.dimBack = new Sprite(0, 0, Graphics.width, Graphics.height);
    this.dimBack.fillRect(0, 0, Graphics.width, Graphics.height);
    this.dimBack.setOpacity(0.7).setZ(0x0a).hide();
  }
  /*-------------------------------------------------------------------------*/
  createparticles(){
    let p = Graphics.Particle, p2 = Graphics.Particle2;
    for(let i=0;i<this.particleNumber;++i){
      let pn = !(i&1) ? p2: p;
      let sp = Graphics.addSprite(pn);
      sp.setZ(0.1);
      this.particles.push(sp);
      this.setParticlePosition(i, true);
    }
  }
  /*-------------------------------------------------------------------------*/
  setParticlePosition(index, randomDist = false){
    let sp = this.particles[index];
    let ux = (Graphics.width - Graphics.padding) / this.particleNumber;
    let dx = ux * index, dy = Graphics.height - Graphics.padding * 2;
    dx = randInt(dx, dx + ux);
    dy = randInt(randomDist ? Graphics.padding : dy, Graphics.height);
    sp.speedFactor = randInt(10,50) / 10.0
    sp.filters = [new PIXI.filters.AdjustmentFilter({red: 1, green: 1, blue: 1})]
    sp.anchor.set(0.5);
    sp.setPOS(dx, dy).setOpacity(0);
    if(!(index & 1)){
      sp.rotationDelta = randInt(20,100) / 2000.0
    }
  }
  /*-------------------------------------------------------------------------*/
  createGameModeWindow(){
    this.gameModeWindow = new Window_GameModeSelect(0, 0, 300, 400);
    let wx = (Graphics.width - this.gameModeWindow.width) / 5;
    this.gameModeWindow.setPOS(wx, 150).setZ(0x10).hide();
  }
  /*-------------------------------------------------------------------------*/
  createGameOptionWindow(){
    this.gameOptionWindow = new Window_GameOption(0, 0, 520, 400);
    let wx = (Graphics.width - this.gameOptionWindow.width) * 7 / 10;
    this.gameOptionWindow.setPOS(wx,150).setZ(0x10).hide();
  }
  /*-------------------------------------------------------------------------*/
  createHelpWindow(){
    let wx = this.gameModeWindow.x, wy = this.gameModeWindow.y;
    let ww = this.gameOptionWindow.width + this.gameOptionWindow.x - wx;
    let wh = 80;
    wy -= wh;
    this.helpWindow = new Window_Help(wx, wy, ww, wh);
    this.helpWindow.setZ(0x10).hide();
    this.gameModeWindow.helpWindow = this.helpWindow;
    this.gameOptionWindow.helpWindow = this.helpWindow;
  }
  /*-------------------------------------------------------------------------*/
  createBackButton(){
    this.backButton = new Window_Back(0, 0, this.onActionBack.bind(this));
    let wx = Graphics.width - this.backButton.width - Graphics.padding;
    let wy = Graphics.padding;
    this.backButton.setPOS(wx, wy).setZ(0x10).hide();
  }
  /*-------------------------------------------------------------------------*/
  onGameStart(){
    this.helpWindow.show().activate().render();
    this.gameModeWindow.show().activate().render();
    this.gameOptionWindow.show().activate().render();
    this.backButton.show().activate().render();
    this.dimBack.show().render();
  }
  /*-------------------------------------------------------------------------*/
  onActionBack(){
    Sound.playCancel();
    this.helpWindow.hide().deactivate();
    this.gameModeWindow.hide().deactivate();
    this.gameOptionWindow.hide().deactivate();
    this.backButton.hide().deactivate();
    this.dimBack.hide().remove();
  }
  /*-------------------------------------------------------------------------*/
  onGameTraditional(){
    GameManager.changeGameMode(0);
  }
  /*-------------------------------------------------------------------------*/
  onGameBattlePuno(){
    GameManager.changeGameMode(1);
  }
  /*-------------------------------------------------------------------------*/
  onGameDeathMatch(){
    GameManager.changeGameMode(2);
  }
  /*-------------------------------------------------------------------------*/
}
/**-------------------------------------------------------------------------
 * Test scene
 */
class Scene_Test extends Scene_Base{
  /*-------------------------------------------------------------------------*/
  constructor(){
    super();
    GameManager.changeGameMode(0);
  }
  /*-------------------------------------------------------------------------*/
  start(){
    super.start();
    SceneManager.goto(Scene_Game);
  }
}
/**-------------------------------------------------------------------------
 * The main scene during gameplay
 * @class Scene_Game
 * @property {String} bgiName - Path to background image
 * @property {String} bgmName - Path to background music
 * @property {String} meName  - Path to music effect (victory theme)
 * @property {Number} cardSpritePoolSize - Object pool size of card sprite
 * @property {Number} animationCount - Counter of animations playing
 * @property {boolean} playerPhase - Whether is user/player's turn
 */
class Scene_Game extends Scene_Base{
  /**-------------------------------------------------------------------------
   * @constructors
   */
  constructor(){
    super();
    this.game = GameManager.initStage();
    this.cardSpritePoolSize = 116;
    this.animationCount     = 0;
    this.playerPhase        = false;
  }
  /*-------------------------------------------------------------------------*/
  create(){
    this.changeAmbient(GameManager.gameMode);
    super.create();
    this.createDeckSprite();
    this.createDiscardPile();
    this.createCardSpritePool();
    this.createHandCanvas();
    this.createHintWindow();
  }
  /*-------------------------------------------------------------------------*/
  start(){
    super.start();
    setTimeout(this.gameStart.bind(this), 1500);
  }
  /*-------------------------------------------------------------------------*/
  gameStart(){
    this.game.gameStart();
    for(let i in this.players){
      this.players[i].lastHand = this.players[i].hand.slice();
    }
    this.players = this.game.players;
    console.log("Game players: " + this.game.players);
  }
  /*-------------------------------------------------------------------------*/
  roundStart(){

  }
  /*-------------------------------------------------------------------------*/
  randomBackground(){
    this.bgiName = Graphics["Background" + randInt(0, 3)];
  }
  /*-------------------------------------------------------------------------*/
  changeAmbient(amb_id){
    this.randomBackground();
    this.bgmName = Sound["Stage" + amb_id];
    this.meName  = Sound["Victory" + amb_id];
  }
  /*-------------------------------------------------------------------------*/
  createBackground(){
    this.backgroundImage = Graphics.addSprite(this.bgiName);
    Graphics.renderSprite(this.backgroundImage);
  }
  /*-------------------------------------------------------------------------*/
  createDeckSprite(){
    let st = Graphics.addSprite(Graphics.CardBack);
    let sb = Graphics.addSprite(Graphics.CardEmpty).hide();
    this.deckSprite = new SpriteCanvas(0, 0, st.width, st.height).setZ(0x10);
    this.deckSprite.addChild(st);
    this.deckSprite.addChild(sb);
    let sx = Graphics.appCenterWidth(st.width) - 100;
    let sy = Graphics.appCenterHeight(st.height / 2);
    this.deckSprite.setPOS(sx, sy).activate().scale.set(0.5, 0.5);
    this.deckSprite.on('mouseover', ()=>{
      this.showHintWindow(null,null,Vocab["HelpDeck"] + this.getDeckLeftNumber)
    });
    this.deckSprite.on('mouseout', ()=>{this.hideHintWindow()});
    Graphics.renderSprite(this.deckSprite);
  }
  /*-------------------------------------------------------------------------*/
  createDiscardPile(){
    let sw = 200, sh = 200;
    let sx = Graphics.appCenterWidth(sw) + Graphics.padding;
    let sy = Graphics.appCenterHeight(sh);
    this.discardPile = new SpriteCanvas(sx, sy, sw, sh);
    this.discardPile.activate().setZ(0x10);
    if(DebugMode){this.discardPile.fillRect(0, 0, sw, sh).setZ(0).setOpacity(0.5);}
    this.discardPile.on("mouseover", ()=>{
      this.showHintWindow(null,null, Vocab["HelpDiscardPile"] + this.getLastCardInfo)
    });
    this.discardPile.on("mouseout",()=>{this.hideHintWindow()});
    Graphics.renderSprite(this.discardPile);
  }
  /*-------------------------------------------------------------------------*/
  getIdleCardSprite(){
    for(let i in this.spritePool){
      if(this.spritePool[i].playerIndex == -2){
        return this.spritePool[i];
      }
    }
    this.cardSpritePoolSize += 1;
    let sp = this.createCardSprite();
    this.spritePool.push(sp);
    return sp;
  }
  /*-------------------------------------------------------------------------*/
  createCardSpritePool(){
    this.spritePool = [];
    this.cardValueCount = [];
    for(let i=0;i<this.cardSpritePoolSize;++i){
      this.spritePool.push(this.createCardSprite());
    } 
  }
  /*-------------------------------------------------------------------------*/
  createCardSprite(){
    let i  = this.spritePool.length;
    let sp = Graphics.addSprite(Graphics.CardBack, "card" + i).hide();
    let sx = this.deckSprite.x + this.deckSprite.width / 2;
    let sy = this.deckSprite.y + this.deckSprite.height / 2;
    sp.setZ(0x11).scale.set(0.5, 0.5);
    sp.anchor.set(0.5, 0.5);
    sp.index    = i;      // index in the pool
    sp.handIndex = -1;    // index in player's hand
    sp.playerIndex = -2;  // this card belongs to which player
    sp.setPOS(sx, sy).render();
    return sp;
  }
  /*-------------------------------------------------------------------------*/
  createHandCanvas(){
    this.handCanvas = [];
    let maxNumbers  = [3, 2, 2, 3];
    let counter     = [0, 0, 0, 0];
    let sh = 225, sw = 350, sx, sy;

    for(let i=0;i<GameManager.playerNumber;++i){
      counter[i % 4] += 1;
      this.handCanvas.push(new SpriteCanvas(0, 0, sw, sh));
      this.handCanvas[i].playerIndex = i;
      this.handCanvas[i].render();
    }

    for(let i=0;i<4;++i){
      let portion = Math.min(counter[i], maxNumbers[i]);
      let partWidth  = Graphics.width  / portion;
      let partHeight = Graphics.height / portion;
      for(let j=0;j<counter[i];++j){
        let index = i + (4 * j);
        let hcs   = this.handCanvas[index];
        // up/down
        if(!(i&1)){
          // Divide canvas space
          sx = partWidth * j;
          if(partWidth > hcs.width){sx = (partWidth - hcs.width) / 2;}
          // Align bottom if i == 0 (down)
          sy = (i == 0) ? Graphics.height - hcs.height : Graphics.spacing;
          hcs.setPOS(sx, sy);
        }
        // left/right
        else{
          hcs.resize(sh, sw);
          sy = partHeight * j;
          if(partHeight > hcs.height){sy = (partHeight - hcs.height) / 2;}
          // Align left if i == 1 (left)
          sx = (i == 1) ? Graphics.spacing : Graphics.width - hcs.width;
          hcs.setPOS(sx, sy);
        }

        if(DebugMode){hcs.fillRect(0, 0, hcs.width, hcs.height).setOpacity(0.5);}
      }
    }
  }
  /*-------------------------------------------------------------------------*/
  arrangeHandCards(index){
    let hcs  = this.handCanvas[index];
    let side = index % 4;
    let cardSize  = this.players[index].hand.length;
    let cardWidth = Graphics.CardRectReg.width;
    let cardHeight = Graphics.CardRectReg.height;
    let canvasWidth  = !(index&1) ? hcs.width  : hcs.height;
    let canvasHeight = !(index&1) ? hcs.height : hcs.width;
    let stackPortion = parseFloat(((canvasWidth - cardWidth) / (cardSize * cardWidth)).toFixed(3));
    let totalWidth   = cardWidth + (cardWidth * stackPortion * (cardSize - 1));
    let cur_player   = this.players[index];
    let base_pos     = (canvasWidth - totalWidth) / 2;
    if(!(side&1)){
      for(let i in cur_player.hand){
        let card = cur_player.hand[i];
        card.sprite.setPOS(canvasWidth/2,canvasHeight/2).setZ(0x11 + parseInt(i));
        let dx = base_pos + cardWidth * stackPortion * i + cardWidth / 2;
        let dy = (side == 0) ? canvasHeight - cardHeight + cardHeight / 2 : cardHeight / 2;
        this.animationCount += 1;
        hcs.addChild(card.sprite);
        card.sprite.moveto(dx, dy, function(){
          this.animationCount -= 1;
        }.bind(this));
      }
    }
    else{
      for(let i in cur_player.hand){
        let card = cur_player.hand[i];
        card.sprite.setPOS(canvasWidth/2,canvasHeight/2).setZ(0x11 + parseInt(i));
        let dy = base_pos + cardWidth * stackPortion * i + cardWidth / 2;
        let dx = (side == 1) ? Graphics.spacing + cardHeight/2: canvasHeight - cardHeight + cardHeight / 2;
        this.animationCount += 1;
        hcs.addChild(card.sprite);
        card.sprite.moveto(dx, dy, function(){
          this.animationCount -= 1;
        }.bind(this));
      }
    }
    hcs.sortChildren();
    this.players[index].lastHand = this.players[index].hand.slice();
  }
  /*-------------------------------------------------------------------------*/
  onCardZoomIn(card){

  }
  /*-------------------------------------------------------------------------*/
  onCardZoomOut(card){

  }
  /*-------------------------------------------------------------------------*/
  playColorEffect(cid){

  }
  /*-------------------------------------------------------------------------*/
  addDiscardCard(card, player_id = 0){
    card.sprite.show().anchor.set(0.5, 0.5);
    if(player_id >= 0){
      let deg = -20 + player_id * (360 / GameManager.playerNumber) + randInt(0, 40);
      card.sprite.rotateDegree(deg);
    }
    let sx = this.discardPile.x + this.discardPile.width / 2;
    let sy = this.discardPile.y + this.discardPile.height / 2;
    let cx = (this.discardPile.width) / 2;
    let cy = (this.discardPile.height) / 2;
    this.animationCount += 1;
    card.sprite.moveto(sx, sy, function(){
      this.playColorEffect(card.color);
      this.animationCount -= 1;
      this.discardPile.addChild(card.sprite);
      card.sprite.setPOS(cx, cy);
    }.bind(this));
  }
  /*-------------------------------------------------------------------------*/
  clearDiscardPile(){
    while(this.discardPile.children.length > 1){
      this.discardPile.children.pop().hide();
    }
  }
  /*-------------------------------------------------------------------------*/
  createHintWindow(){
    this.hintWindow = new Window_Help(0, 0, 200, 100);
    this.hintWindow.changeSkin(Graphics.WSkinTrans);
    this.hintWindow.font.fontSize = 16;
    this.hintWindow.padding_left  = 20;
    this.hintWindow.setZ(0x20).hide().render();
  }
  /*-------------------------------------------------------------------------*/
  update(){
    super.update();
    this.updateGame();
    this.updateCards();
  }
  /*-------------------------------------------------------------------------*/
  updateGame(){
    if(this.game.deck){this.game.update();}
  }
  /*-------------------------------------------------------------------------*/
  updateCards(){
    for(let i in this.spritePool){
      this.spritePool[i].update();
    }
  }
  /*-------------------------------------------------------------------------*/
  showHintWindow(x, y, txt = ''){
    if(x === null){x = Input.mouseAppPOS[0];}
    if(y === null){y = Input.mouseAppPOS[1];}
    this.hintWindow.show().setPOS(x, y).setText(txt);
  }
  /*-------------------------------------------------------------------------*/
  hideHintWindow(){
    this.hintWindow.hide();
  }
  /*-------------------------------------------------------------------------*/
  attachCardInfo(card){
    if(!card.sprite){return ;}
    card.sprite.on('mouseover', ()=>{this.showCardInfo(card)})
    card.sprite.on('mouseout',  ()=>{this.hideHintWindow()})
  }
  /*-------------------------------------------------------------------------*/
  detachCardInfo(card){
    if(!card.sprite){return ;}
    this.hideCardInfo(card);
    card.sprite.removeAllListeners();
  }
  /*-------------------------------------------------------------------------*/
  showCardInfo(card){
    info = this.getCardHelp(card);
    this.showHintWindow(cars.sprite.x, card.sprite.y, info);
  }
  /*-------------------------------------------------------------------------*/
  getCardHelp(card){
    re = ''
    switch(card.color){
      case Color.RED:
        re += Vocab.HelpColorRed + '; '; break;
      case Color.BLUE:
        re += Vocab.HelpColorBlue + '; '; break;
      case Color.YELLOW:
        re += Vocab.HelpColorYellow + '; '; break;
      case Color.GREEN:
        re += Vocab.HelpColorGreen + '; '; break;
      case Color.WILD:
        re += Vocab.HelpColorWild + '; '; break;      
      default:
        re += "???";
    }
    re += 'Effects: \n';
    switch(card.value){
      case Value.ZERO:
        re += Vocab.HelpZero + '; '; break;
      case Value.REVERSE:
        re += Vocab.HelpReverse + '; '; break;
      case Value.SKIP:
        re += Vocab.HelpSkip + '; '; break;
      default:
        re += this.getEffectsHelp(GameManager.interpretCardAbility(card, 0));
    }
    re += getCharacterHelp(card);
    return re;
  }
  /*-------------------------------------------------------------------------*/
  getEffectsHelp(effects){
    re = '';
    for(let i in effects){
      let eff = effects[i];
      switch(eff){
        case Effect.DRAW_TWO:
          re += Vocab.HelpPlusTwo + '; '; break;
        case Effect.DRAW_FOUR:
          re += Vocab.HelpPlusFour + '; '; break;
        case Effect.CHOOSE_COLOR:
          re += Vocab.HelpChooseColor + '; '; break;
        case Effect.HIT_ALL:
          re += Vocab.HelpHitAll + '; '; break;
        case Effect.TRADE:
          re += Vocab.HelpTrade + '; '; break;
        case Effect.WILD_CHAOS:
          re += Vocab.HelpChaos + '; '; break;
        case Effect.DISCARD_ALL:
          re += Vocab.HelpDiscardAll + '; '; break;
        case Effect.ADD_DAMAGE:
          re += Vocab.HelpNumber + '; '; break;
      }
    }
    re += '\n';
    return re;
  }
  /*-------------------------------------------------------------------------*/
  getCardHelp(card){
    return '';
  }
  /*-------------------------------------------------------------------------*/
  onCardPlay(pid, card, effects){
    if(pid == -1){
      let sprite = this.getIdleCardSprite();
      let sx = this.deckSprite.x + this.deckSprite.width / 2;
      let sy = this.deckSprite.y + this.deckSprite.height / 2;
      sprite.setPOS(sx, sy);
      let img = this.getCardImage(card);
      console.log(img)
      sprite.texture = Graphics.loadTexture(img); 
      card.sprite = sprite;
      sprite.instance = card;
    }
    else{
      let pos = card.sprite.getGlobalPosition();
      this.handCanvas[pid].removeChild(card.sprite);
      card.sprite.setPOS(pos[0], pos[1]);
    }
    card.sprite.setZ(0x20).handIndex = -1;
    card.sprite.playerIndex = -1;
    console.log("Card play: " + pid, card);
    this.addDiscardCard(card, pid);
  }
  /*-------------------------------------------------------------------------*/
  onCardDraw(pid, cards, show=false){
    pid = parseInt(pid);
    let wt = 300;
    for(let i in cards){
      let ar = (parseInt(i)+1 == cards.length)
      setTimeout(this.processCardDrawAnimation.bind(this, pid, cards[i], show, ar,i), wt * i);
    }
  }
  /*-------------------------------------------------------------------------*/
  processCardDrawAnimation(pid, card, show=false, ar=false,ord=0){
    this.animationCount += 1;
    let sprite = this.getIdleCardSprite().show();
    sprite.playerIndex = pid;
    card.sprite = sprite;
    let dx = 0, dy = 0;
    if(pid >= 0){
      let sx = this.deckSprite.x + this.deckSprite.width / 3;
      let sy = this.deckSprite.y + this.deckSprite.height / 3;
      let deg = pid * (360 / GameManager.playerNumber);
      dx = this.handCanvas[pid].x + this.handCanvas[pid].width / 2;
      dy = this.handCanvas[pid].y + this.handCanvas[pid].height / 2;
      sprite.setPOS(sx, sy).rotateDegree(deg);
    }
    let fallback = function(){
      sprite.texture = Graphics.loadTexture(this.getCardImage(card));
      this.animationCount -= 1;
      if(show){setTimeout(this.sendCardToDeck.bind(this, pid, card), 2000);}
      else if(ar){this.arrangeHandCards(pid)}
    }.bind(this);
    sprite.instance = card;  
    sprite.moveto(dx, dy, fallback);
  }
  /*-------------------------------------------------------------------------*/
  sendCardToDeck(pid, card){
    card.sprite.playerIndex = -2;
    let sx = this.deckSprite.x + this.deckSprite.width / 2;
    let sy = this.deckSprite.y + this.deckSprite.height / 2;
    this.handCanvas[pid].removeChild(card.sprite);
    card.sprite.hide().setPOS(sx,sy);
  }
  /*-------------------------------------------------------------------------*/
  getCardImage(card){
    let symbol = '';
    switch(card.color){
      case Color.RED:
        symbol += 'Red'; break;
      case Color.BLUE:
        symbol += 'Blue'; break;
      case Color.YELLOW:
        symbol += 'Yellow'; break;
      case Color.GREEN:
        symbol += 'Green'; break;
      case Color.WILD:
        symbol += 'Wild'; break;
      default:
        throw new Error("Invalid card color: " + card.color);
    }
    switch(card.value){
      case Value.REVERSE:
        symbol += 'Reverse'; break;
      case Value.SKIP:
        symbol += 'Ban'; break;
      case Value.DRAW_TWO:
        symbol += 'Plus2'; break;
      case Value.WILD_DRAW_FOUR:
        symbol += 'Plus4'; break;
      case Value.WILD:
        symbol += 'Wild'; break;
      case Value.TRADE:
        symbol += 'Exchange'; break;
      case Value.WILD_HIT_ALL:
        symbol += 'Hit'; break;
      case Value.DISCARD_ALL:
        symbol += 'Discard'; break;
      case Value.WILD_CHAOS:
        symbol += 'Chaos'; break;
      default:
        symbol += card.value;
    }
    if(card.value > 9 && card.numID > 0){symbol += '_' + (card.numID + 1);}
    return Graphics[symbol];
  }
  /*-------------------------------------------------------------------------*/
  processUserTurn(pid){
    this.playerPhase = true;
  }
  /*-------------------------------------------------------------------------*/
  processUserTurnEnd(){
    this.playerPhase = false;
  }
  /*-------------------------------------------------------------------------*/
  processNPCTurn(pid){
    
  }
  /*-------------------------------------------------------------------------*/
  applyColorChangeEffect(cid){
    debug_log("Color Changed: " + cid);
  }
  /*-------------------------------------------------------------------------*/
  processGameOver(){

  }
  /*-------------------------------------------------------------------------*/
  processRoundOver(){

  }
  /*-------------------------------------------------------------------------*/
  isBusy(){
    return super.isBusy() || this.isAnimationPlaying() || this.isPlayerThinking();
  }
  /*-------------------------------------------------------------------------*/
  isAnimationPlaying(){
    return this.animationCount != 0;
  }
  /*-------------------------------------------------------------------------*/
  isPlayerThinking(){
    return this.playerPhase;
  }
  /*-------------------------------------------------------------------------*/
  get getLastCardInfo(){
    return '';
  }
  /*-------------------------------------------------------------------------*/
  get getDeckLeftNumber(){
    return this.game.deck ? this.game.deck.length : 0;
  }
  /*-------------------------------------------------------------------------*/
}