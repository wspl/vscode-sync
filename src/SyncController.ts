import { window, commands, workspace, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument } from 'vscode';
import { Sync, SyncConfig } from './Sync';

export class SyncController {
    
    private statusBarItem: StatusBarItem;
    private disposable: Disposable;

    constructor() {
        this.init();
    }
    
    async init() {
        await Sync.load(workspace.rootPath);
        
        if (Sync.isEnabled) {
            window.showInformationMessage('Sync loaded!')
        } else {
            return;
        }
        
        if (!this.statusBarItem) { 
            this.statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left); 
        }  
        
        Sync.setIntraction(this.updateState, window.showInformationMessage);
        
        this.updateState('Hello Sync: ' + workspace.rootPath);

        let subscriptions: Disposable[] = [];

        workspace.onDidSaveTextDocument(this.onSave, this, subscriptions);

        this.disposable = Disposable.from(...subscriptions);
    }
    
    updateState(text: string) {
        this.statusBarItem.text = `$(cloud-upload)  ${text}`; 
        this.statusBarItem.show(); 
    }
    
    dispose() {
        this.disposable.dispose();
    }

    private onSave(doc: TextDocument) {
        //Sync.upload(doc.uri.path);
        window.showInformationMessage("Hello onSave!");
        this.updateState("Hello Saved!");
    }
}