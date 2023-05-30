const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld(
    'api',
	{
		error: async (title,msg) => {
			await ipcRenderer.invoke('showErrorBox',[title,msg]);
		},
		alert : async (title,msg) => {
            await ipcRenderer.invoke('showMessageBox',[title,msg]);
		},
		confirm : async (title,msg)=>{
			var result = await ipcRenderer.invoke('showConfirmBox',[title,msg]);
			//console.log("PRELOAD showConfirmBox",result['response']);
			return result['response'];
		},
        showDialog: async () => await ipcRenderer.invoke('dialog:open'),
		resize : async (width,height) => {
			await ipcRenderer.invoke('windowSizeChange',[width,height]);
		},
		setItem : async (key,value)=>{
			//console.log("setItem Call",key,value);
			await ipcRenderer.invoke('setItem',key,value);
		},
		getItem : async (key)=>{
			const item = await ipcRenderer.invoke('getItem',key);
			//console.log("PRELOAD GET ITEM RESULT",item);
			return item;
			
		},
		clearItem : async () =>{
			await ipcRenderer.invoke('clearItem');
		},
		getVersion : async() => {
			const version = await ipcRenderer.invoke('getVersion');
			return version;
		},
		encrypt : async(text) => {
			return await ipcRenderer.invoke('encrypt',text);
		},
		decrypt : async(text) => {
			return await ipcRenderer.invoke('decrypt',text);
		},
		qr_code_issue : async(text) => {
			return await ipcRenderer.invoke('qr_code_issue',text);
		},
		browser_open : async(text) => {
			return await ipcRenderer.invoke('browser_open',text);
		},
		 
    }
)