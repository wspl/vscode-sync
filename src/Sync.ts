import * as Path from 'path';
import * as FS from 'fs';
import { TransportClient, Transports, SyncServer } from './Transport/Transport';
import { SyncController } from './SyncController';
import { window } from 'vscode';
import * as Utils from './Utils';

export interface SyncConfig extends JSON {
    remotePath: string;
    uploadWhenSaved: boolean;
    syncMethod: string;
    ignore: Array<string>;
}

export class Sync {
    public static client: TransportClient;
    public static config: SyncConfig;
    
    public static isEnabled: boolean = false;
    public static localPath: string;
    public static remotePath: string;

    public static async load (rootPath: string, isReload?: boolean) {
        SyncController.updateStatus(isReload ? 'Reconnectring...' : 'Connectring...');
        try {
            this.config = <SyncConfig> await Utils.readJSON(rootPath + '/.vscode-sync.json');
            this.localPath = rootPath;
            this.remotePath = this.config.remotePath;
            
            await this.loadClient(isReload);
            
            this.isEnabled = true;
            SyncController.updateStatus('Sync server - ' + this.config[this.config.syncMethod].host);
        } catch (e) {
            this.isEnabled = false;
            window.showErrorMessage('Cannot initilize Sync! Please check your ".vscode-sync.json" file.');
            SyncController.updateStatus('Sync unable to work! Please check your ".vscode-sync.json" file.');
        }
    }

    public static async loadClient (isReload?: boolean) {
        if (!this.client || isReload) {
            this.client = Transports.get(this.config.syncMethod);
            await this.client.connect(this.config[this.config.syncMethod]);
        } else {
            if (!this.client.isConected) {
                await this.client.connect(this.config[this.config.syncMethod]);
            }
        }
    }
    
    public static async upload (rPath: string) {
        const remotePath = this.config.remotePath + rPath;
        try {
            if (await Utils.isFileExist(this.localPath + rPath)) {
                await this.client.put(this.localPath + rPath, remotePath)
                return true;
            } else {
                console.log('LOCAL_ENOENT');
                return false;
            }
        } catch (e) {
            if (e.code === 2) {
                await this.remoteMkdirp(remotePath);
                return await this.upload(rPath)
            } else {
                console.log(e.toString());
                return false;
            }
        }
    }

    public static async remoteMkdirp (path: string) {
        Utils.getDirs(path).forEach(async (dir) => await this.client.mkdir(dir))
    }

    public static async uploadFolder (path: string) {
        try {
            const files = await Utils.listFiles(path, this.config.ignore);
            
            let succeed = 0;
            let failed = 0;
            const total = files.size;
            
            for (let rPath of files) {
                if (failed) {
                    SyncController.updateStatus(`(${succeed}/${total} succeed, ${failed} failed) Uploading ${rPath} ...`);
                } else {
                    SyncController.updateStatus(`(${succeed}/${total} succeed) Uploading ${rPath} ...`);
                }
                
                if (await this.upload(rPath)) {
                    succeed += 1;
                } else {
                    console.log(rPath);
                    failed += 1;
                }
            }
            
            if (!failed) {
                window.showInformationMessage(`Sync finished: ${succeed}/${total} succeed`);
            } else {
                window.showWarningMessage(`Sync finished: ${succeed}/${total} succeed, ${failed} failed`);
            }
            
            SyncController.updateStatus('Sync server - ' + this.config[this.config.syncMethod].host);
        } catch (e) {
            console.log(e.toString());
        }
    }
}