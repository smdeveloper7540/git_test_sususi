const { app, BrowserWindow, Tray, Menu, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const iconPath = path.join(__dirname, 'icon.png')

const isDev = require('electron-is-dev')
const log = require('electron-log')

//electron에서 브라우저 열기
const shell = require('electron').shell;

const {
  MAIN_WIDTH,
  MAIN_HEIGHT,
  LOGIN_WIDTH,
  LOGIN_HEIGHT,
  APP_NAME,
} = require('./lib/constant.js')

//숏컷 단축키설정
const electronLocalshortcut = require('electron-localshortcut')

//자동실행
const AutoLaunch = require('auto-launch')

//자동 버전 업데이트
//package.josn build부분 확인
//GH_TOKEN 세팅 -> github -> setting -> Developer settings -> Personal access tokens 생성
//윈도우 환경변수 GH_TOKEN 생성 후 생성된 토큰 붙이기
//깃헙 릴리즈 페이지에서 draft 된부분에서 릴리즈로 변경

const { autoUpdater } = require('electron-updater')
autoUpdater.logger = log
autoUpdater.logger.transports.file.level = 'info'

//변수저장
const Store = require('electron-store')
Store.initRenderer()

const store = new Store()

//암호화
const crypto = require('crypto')

const algorithm = 'aes-256-cbc'

const ENCRYPTION_KEY = 'softplansoftplansoftplansoftplan' // Must be 256 bits (32 characters)
const IV_LENGTH = 16 // For AES, this is always 16

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY),
    iv,
  )
  const encrypted = cipher.update(text)

  return (
    iv.toString('hex') +
    ':' +
    Buffer.concat([encrypted, cipher.final()]).toString('hex')
  )
}

function decrypt(text) {
  const textParts = text.split(':')
  const iv = Buffer.from(textParts.shift(), 'hex')
  const encryptedText = Buffer.from(textParts.join(':'), 'hex')
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY),
    iv,
  )
  const decrypted = decipher.update(encryptedText)

  return Buffer.concat([decrypted, decipher.final()]).toString()
}
//qr프린트
function qr_code_issue(text){
  const content = text;

  fs.writeFile(app.getPath('userData')+"/qr_code.txt", content, err => {
    if (err) {
      console.error(err)
      return
    }
    //file written successfully
  })
}
//electron->browser열기
function browser_open(text){
  require("electron").shell.openExternal(text);
}

log.info('App starting...')

let tray = null
let mainWindow
const createWindow = () => {
  //console.log(isDev);

  mainWindow = new BrowserWindow({
    width: LOGIN_WIDTH,
    height: LOGIN_HEIGHT,
    //frame: false,
    //resizable: false,
    webPreferences: {
      enableRemoteModule: true,

      /* NODEJS관련 사용시 2개옵션확인 */
      contextIsolation: true,
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  var isLogin = store.get('login', 'N')
  log.debug('LOGIN FLAG CHECK ', isLogin)

  if (isLogin == 'Y') {
    mainWindow.setSize(MAIN_WIDTH, MAIN_HEIGHT)
    mainWindow.loadFile('./views/index.html')
  } else {
    mainWindow.loadFile('./views/login.html')
  }

  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.setIcon(iconPath)

  //메뉴바 삭제
  mainWindow.setMenuBarVisibility(false)

  //항상위에
  mainWindow.setAlwaysOnTop(true)

  //mainWindow.maximize();
  //mainWindow.setFullScreen(true);

  tray = new Tray(iconPath)
  tray.setToolTip(APP_NAME)

  var contextMenu = Menu.buildFromTemplate([
    {
      label: '실행',
      click: function () {
        mainWindow.show()
      },
    },
    {
      label: '종료',
      click: function () {
        app.quit()
      },
    },
  ])

  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    mainWindow.show()
    //	win.isVisible() ? win.hide() : win.show()
  })

  mainWindow.on('minimize', function (event) {
    event.preventDefault()
    mainWindow.hide()
  })

  mainWindow.on('closed', function () {
    mainWindow = null
  })
  mainWindow.on('show', function () {})

  //https://www.electronjs.org/docs/latest/api/ipc-main
  //https://www.electronjs.org/docs/latest/api/ipc-renderer

  ipcMain.handle('dialog:open', async (_, args) => {
    const result = await dialog.showOpenDialog({ properties: ['openFile'] })
    return result
  })

  //https://www.brainbell.com/javascript/dialog-show-message-box.html
  //alert창
  ipcMain.handle('showMessageBox', async (_, args) => {
    const result = await dialog.showMessageBox(mainWindow, {
      type: 'info', //"none", "info", "error", "question", "warning"
      title: args[0],
      message: args[1],
    })
    return result
  })

  //error창
  ipcMain.handle('showErrorBox', async (_, args) => {
    // const result = await dialog.showErrorBox(args[0], args[1])
    const result = await dialog.showMessageBox(mainWindow, {
      type: 'error', //"none", "info", "error", "question", "warning"
      title: args[0],
      message: args[1],
    })
    return result
  })
  //confirm 창
  ipcMain.handle('showConfirmBox', async (_, args) => {
    const result = await dialog.showMessageBox(mainWindow, {
      type: 'question', //"none", "info", "error", "question", "warning",
      //buttons: ["Yes","No","Cancel"], //(0 for Yes, 1 for No and 2 for Cancel).
      buttons: ['Yes', 'No'],
      title: args[0],
      message: args[1],
    })
    //console.log("showConfirmBox",result);
    return result
  })

  //창 크기변경
  ipcMain.handle('windowSizeChange', async (_, args) => {
    //console.log(args);
    mainWindow.setSize(args[0], args[1]) //width, height
  })

  //로컬스토리지 활용
  ipcMain.handle('setItem', async (_, key, value) => {
    //console.log("setItem",key,value);
    store.set(key, value)
  })

  ipcMain.handle('getItem', async (_, key) => {
    const item = store.get(key)
    //console.log("getItem",key,"result",item);;
    return item
  })

  ipcMain.handle('clearItem', async (_) => {
    //console.log("clearItem");
    store.clear()
  })

  ipcMain.handle('getVersion', async (_) => {
    return app.getVersion()
  })

  ipcMain.handle('encrypt', async (_, text) => {
    return encrypt(text)
  })

  ipcMain.handle('decrypt', async (_, text) => {
    return decrypt(text)
  })
  ipcMain.handle('qr_code_issue',async (_, text) => {
    return qr_code_issue(text)
  })

  ipcMain.handle('browser_open',async (_, text) => {
    return browser_open(text)
  })

  //컴퓨터 부팅시 실행
  console.log( app.getPath('exe'));
  let autoLaunch = new AutoLaunch({
    name: '스스시',
    path: app.getPath('exe'),
  })
  
  autoLaunch.isEnabled().then((isEnabled) => {
    if (!isEnabled) autoLaunch.enable()
  })

  if(isDev){
  //개발자도구 On/Off
    electronLocalshortcut.register(mainWindow, 'F12', () => {
      mainWindow.webContents.toggleDevTools()
    })
  }
  //새로고침
  electronLocalshortcut.register(mainWindow, 'F5', () => {
    mainWindow.webContents.reload()
  })
  //
}
app.whenReady().then(() => {
  createWindow()

  //자동 버전 업로드 기능설정
  log.info('APP VERSION : ' + app.getVersion())
  //자동 업데이트 등록
  autoUpdater.checkForUpdates()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

//자동업데이트
//https://www.electron.build/configuration/publish

autoUpdater.on('checking-for-update', () => {
  log.info('UPDATE_CHECK NOW VERSION', app.getVersion())
  //console.log(app.getVersion());
})
autoUpdater.on('update-available', (info) => {
  //console.log('UPDATE_AVAIL.');
  log.info('UPDATE_AVAIL.', info)
})
autoUpdater.on('update-not-available', (info) => {
  //console.log('UPDATE_NOT_AVAIL.');
  log.info('UPDATE_NOT_AVAIL')
})
autoUpdater.on('error', (err) => {
  log.info('ERROR : ' + err)
})
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = 'DOWNLOAD SPEED: ' + progressObj.bytesPerSecond
  log_message = log_message + ' - NOW ' + progressObj.percent + '%'
  log_message =
    log_message + ' (' + progressObj.transferred + '/' + progressObj.total + ')'
  log.info(log_message)
})
autoUpdater.on('update-downloaded', (info) => {
  log.info('DOWNLOAD COMPLETE', info)

  setImmediate(() => {
    log.info('call1')

    app.removeAllListeners('window-all-closed')
    if (mainWindow != null) {
      log.info('quit')
      mainWindow.close()
    }
    log.info('quitAndInstall')
    autoUpdater.quitAndInstall(false)
  })

  /*
    const dialogOpts = {
        type: 'info',
        buttons: ['확인'],
        title: 'Application Update',
        message: '새로운 버전이 다운로드 되었습니다. 앱종료후 설치가 진행됩니다. 종료후 재시작해주세요.',
        detail: '새로운 버전이 다운로드 되었습니다. 앱종료후 설치가 진행됩니다. 종료후 재시작해주세요.'
    };
    dialog.showMessageBox(dialogOpts, (response) => {
        log.info(response);
        setImmediate(() => {
            log.info("call1");
            
            app.removeAllListeners("window-all-closed")
            if (mainWindow != null) {
                log.info("quit");
                mainWindow.close()
            }
            log.info("quitAndInstall");
            autoUpdater.quitAndInstall(false)


        })
    });
    */
})
