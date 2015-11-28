import { window, commands, workspace, extensions, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument, Uri } from 'vscode';
import { Sync, SyncConfig } from './Sync';
import * as Utils from './Utils';
import * as FS from 'fs';
import * as vscode from 'vscode';

export class SyncController {
    
    public static statusBarItem: StatusBarItem;
    private static disposable: Disposable;
    private static isLoaded: boolean = false;

    static async init () {
        commands.registerCommand('Sync.Init', this.onInit);
        commands.registerCommand('Sync.UploadAll', this.onUploadAll);
        
        let subscriptions: Disposable[] = [];
    
        workspace.onDidSaveTextDocument(this.onSave, this, subscriptions);
  
        if (await Utils.isFileExist(Utils.pathfix(workspace.rootPath + '/.vscode-sync.json'))) {
            await this.load();
        }
        
        this.disposable = Disposable.from(...subscriptions);
    }
    
    static async load () {
        this.isLoaded = true;
            
        if (!this.statusBarItem) { 
            this.statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left); 
        }

        this.statusBarItem.text = `$(cloud-upload)  Sync 0.0.1`;
        this.statusBarItem.show();

        await Sync.load(Utils.pathfix(workspace.rootPath), false);
    }
    
    static dispose () {
        this.disposable.dispose();
    }

    static async onSave (doc: TextDocument) {
        const path = Utils.pathfix(doc.uri.fsPath);
        const rPath = path.substr(Utils.pathfix(workspace.rootPath).length);
        
        if (rPath === '/.vscode-sync.json') {
            if (this.isLoaded) {
                window.showInformationMessage('The new configurations of Sync has been applied now!')
                await Sync.load(Utils.pathfix(workspace.rootPath), true);
            } else {
                window.showInformationMessage('The configurations of Sync has been applied now!')
                await this.load();
            }
        }

        if (Sync.config.ignore.indexOf(rPath) === -1) {
            if (Sync.isEnabled) {
                if (await Sync.upload(rPath)) {
                    window.showInformationMessage('Uploaded!');
                } else {
                    window.showErrorMessage('Upload Failed!');
                }
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
    
    static onInit () {
        const configFile = Utils.pathfix(workspace.rootPath + '/.vscode-sync.json');
        const selfPath = Utils.pathfix(extensions.getExtension('Plutonist.sync').extensionPath);
        FS.createReadStream(selfPath + '/.vscode-sync-template.json')
            .pipe(FS.createWriteStream(configFile))
            .on('finish', async () => {
                const doc = await workspace.openTextDocument(Uri.file(configFile))
                await window.showTextDocument(doc);
                window.showInformationMessage('Create configuration file successful!');
            });
    }
}