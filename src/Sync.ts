import * as Path from 'path';
import * as FS from 'fs';
import { TransportClient, Transports, SyncServer } from './Transport/Transport';
import { readJSON } from './Utils';

export interface SyncConfig extends JSON {
    remotePath: string;
    uploadWhenSaved: boolean;
    syncMethod: string;
}

export class Sync {
    private static client: TransportClient;
    private static config: SyncConfig;
    public static isEnabled: boolean = false;
    
    private static updateState: (text: string) => void;
    private static showMessage: (text: string) => void;

    public static async setIntraction(updateState: (text: string) => void, showMessage: (text: string) => void) {
        this.updateState = updateState;
        this.showMessage = showMessage;
    }

    public static async load (rootPath: string) {
        try {
            this.config = <SyncConfig> await readJSON(rootPath + '/.vscode-sync.json');
            this.loadClient();
            this.isEnabled = true;
        } catch (e) {
            this.isEnabled = false;
        }
    }

    public static async loadClient () {
        try {
            if (this.client) {
                if (this.client.isConected) {
                    
                } else {
                    await this.client.connect(this.config[this.config.syncMethod]);
                }
            } else {
                this.client = Transports.get(this.config.syncMethod);
                await this.client.connect(this.config[this.config.syncMethod]);
            }
        } catch (e) {
            console.log(e.toString());
        }
    }

    public static async upload (path: string) {
        
    }
}