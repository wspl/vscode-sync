import * as ssh2 from 'ssh2';
import * as vscode from 'vscode';
import * as Path from 'path';
import * as FS from 'fs';
import { TransportClient, SyncPath, PathType, SyncServer } from './Transport';
import { readBuffer } from '../Utils';

interface SFTPRemotePath extends Object {
    filename: string;
    longname: string;
    attrs: SFTPRemotePathAttr;
}

interface SFTPRemotePathAttr extends Object {
    mode: number;
    permissions: number;
    uid: number;
    gid: number;
    size: number;
    atime: number;
    mtime: number;
    isFile: () => void;
}

interface SFTPServer extends SyncServer {
    host: string;
    port: number;
    username: string;
    password?: string;
    privateKey?: any;
    publicKey?: any;
    passphrase?: string;
}

export class Client implements TransportClient {
    
    private sftp: any;
    private conn: any = new ssh2.Client();
    public isConected: boolean = false;

    public connect (server: SFTPServer): Promise<any> {
        return new Promise(async (resolve: () => void, reject: (error?: Error) => void) => {
            if (this.isConected) {
                await this.disconnect();
            }
            if (server.privateKey) {
                server.privateKey = readBuffer(server.privateKey);
            }
            if (server.publicKey) {
                server.publicKey = readBuffer(server.publicKey);
            }
            this.conn.on('ready', () => {
                this.conn.sftp((err: any, sftp: any) => {
                    if (!err) {
                        this.sftp = sftp;
                        this.isConected = true;
                        resolve();
                    } else {
                        reject(err);
                    }
                });
            })
            .on('error', (e) => {
                reject(e);
            })
            .connect(server);
        })
    }
    
    public disconnect (): Promise<any> {
        return new Promise((resolve: () => void, reject: (error?: any) => void) => {
            if (!this.isConected) {
                reject({
                    name: 'NO_CONNECTION',
                    code: 101,
                    message: 'No connection'
                });
                return;
            }
            if (this.conn) {
                this.conn.end();
                this.conn = new ssh2.Client();
            }
            if (this.sftp) {
                this.sftp.end();
                this.sftp = null;
            }
            this.isConected = false;
            resolve();
        });
    }
    
    public listFiles (path: string): Promise<any> {
        return new Promise((resolve: (list: Set<SyncPath>) => void, reject: (error?: any) => void) => {
            if (!this.isConected) {
                reject({
                    name: 'NO_CONNECTION',
                    code: 101,
                    message: 'No connection'
                });
                return;
            }
            
            let dict = new Set<SyncPath>();
            let workingDir = new Map<string, number>(); // 1 - in-queue, 2 - in-progress
            
            const dodo = (p: string) => {
                workingDir.set(p, 2);
                this.sftp.readdir(p, (err: any, list: Array<SFTPRemotePath>) => {
                    if (err) reject(err);
                    
                    list.forEach((item: SFTPRemotePath) => {
                        const lp: SyncPath = {
                            name: item.filename,
                            path: Path.join(p, item.filename).replace(/\\/g, '/'),
                            rPath: Path.join(p, item.filename).replace(/\\/g, '/').substr(path.length),
                            dirname: path,
                            type: item.attrs.isFile() ? PathType.File : PathType.Folder
                        };
                        dict.add(lp);
                        if (!item.attrs.isFile()) {
                            workingDir.set(lp.path, 1);
                        }
                    });
                    
                    workingDir.delete(p);
                    
                    if (workingDir.size === 0) {
                        resolve(dict);
                    }
                    
                    workingDir.forEach((code: number, pp: string) => {
                        if (code === 1) {
                            dodo(pp);
                        }
                    });
                })
            }
            
            dodo(path);
        });
    }
    
    public mkdir (dirPath: string): Promise<any> {
        return new Promise((resolve: () => void, reject: (error?: any) => void) => {
            if (!this.isConected) {
                reject({
                    name: 'NO_CONNECTION',
                    code: 101,
                    message: 'No connection'
                });
                return;
            }
            
            this.sftp.mkdir(dirPath, {}, (err: any) => {
                // if (err) console.log(dirPath);
                resolve();
            })
        });
    }

    public put (localPath: string, remotePath: string, progress?: (percentage: number) => void): Promise<any> {
        return new Promise((resolve: () => void, reject: (error?: any) => void) => {
            if (!this.isConected) {
                reject({
                    name: 'NO_CONNECTION',
                    code: 101,
                    message: 'No connection'
                });
                return;
            }
            
            this.sftp.fastPut(localPath, remotePath, {
                step: (read: number, chunk: any, size: number) => {
                    progress ? progress.apply(null, [read / size]) : 0;
                }
            }, (err: any) => {
                if (!err) {
                    resolve();
                } else {
                    reject(err);
                }
            });
        });
    }
    
    public get (remotePath: string, localPath: string, progress?: (percentage: number) => void): Promise<any> {
        return new Promise((resolve: () => void, reject: (error?: any) => void) => {
            if (!this.isConected) {
                reject({
                    name: 'NO_CONNECTION',
                    code: 101,
                    message: 'No connection'
                });
                return;
            }
            
            this.sftp.fastPut(remotePath, localPath, {
                step: (read: number, chunk: any, size: number) => {
                    progress ? progress.apply(null, [read / size]) : 0;
                }
            }, (err: any) => {
                if (!err) {
                    resolve();
                } else {
                    reject(err);
                }
            });
        });
    }
    
    public unlink (remotePath: string): Promise<any> {
        return new Promise((resolve: () => void, reject: (error?: any) => void) => {
            if (!this.isConected) {
                reject({
                    name: 'NO_CONNECTION',
                    code: 101,
                    message: 'No connection'
                });
                return;
            }
            
            this.sftp.unlink(remotePath, (err: any) => {
                if (!err) {
                    resolve();
                } else {
                    reject(err);
                }
            });
        });
    }
    
    public rmdir (remotePath: string): Promise<any> {
        return new Promise((resolve: () => void, reject: (error?: any) => void) => {
            if (!this.isConected) {
                reject({
                    name: 'NO_CONNECTION',
                    code: 101,
                    message: 'No connection'
                });
                return;
            }
            
            this.sftp.rmdir(remotePath, (err: any) => {
                if (!err) {
                    resolve();
                } else {
                    reject(err);
                }
            });
        });
    }
}


