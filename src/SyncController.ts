import { window, commands, workspace, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument } from 'vscode';
import { Sync, SyncConfig } from './Sync';
import * as Utils from './Utils';
import * as FS from 'fs';

export class SyncController {
    
    public static statusBarItem: StatusBarItem;
    private static disposable: Disposable;
    
    static async init () {
        if (!this.statusBarItem) { 
            this.statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left); 
        }

        this.statusBarItem.text = `$(cloud-upload)  Sync 0.0.1`;
        this.statusBarItem.show();
        
        let subscriptions: Disposable[] = [];

        workspace.onDidSaveTextDocument(this.onSave, this, subscriptions);
        
        commands.registerCommand('Sync.UploadAll', this.onUploadAll);
        
        this.disposable = Disposable.from(...subscriptions);

        await Sync.load(Utils.pathfix(workspace.rootPath), false);
    }

    static dispose () {
        this.disposable.dispose();
    }

    static async onSave (doc: TextDocument) {
        const path = Utils.pathfix(doc.uri.fsPath);
        const rPath = path.substr(Utils.pathfix(workspace.rootPath).length);
        
        if (rPath === '/.vscode-sync.json') {
            window.showInformationMessage('The new configurations of Sync has been applied now!')
            await Sync.load(Utils.pathfix(workspace.rootPath), true);
        }
        
        if (Sync.config.ignore.indexOf(rPath) === -1) {
            if (Sync.isEnabled) {
                if (await Sync.upload(rPath)) {
                    window.showInformationMessage('Uploaded!');
                } else {
                    window.showErrorMessage('Upload Failed!');
                }
            } else {
                 window.showErrorMessage('No connection!')
            }
        }
    }
    
    static updateStatus (text: string) {
        this.statusBarItem.text = `$(cloud-upload)  ${text}`;
    }
    
    static onUploadAll () {
        if (Sync.isEnabled) {
            Sync.uploadFolder(Utils.pathfix(workspace.rootPath));
        } else {
            window.showErrorMessage('No connection!')
        }
    }
}