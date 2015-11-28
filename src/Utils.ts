import * as FS from 'fs';
import * as Path from 'path';
import * as vscode from 'vscode';

export async function readJSON (path: string) {
    return new Promise((resolve: (content: JSON) => void, reject: (err: Error) => void) => {
        FS.readFile(path, (err: Error, data: Buffer) => {
            if (err) reject(err);
            else resolve(JSON.parse(stripJsonComments(data.toString())));
        })
    });
}

export async function readBuffer (path: string) {
    return new Promise((resolve: (content: Buffer) => void, reject: (err: Error) => void) => {
        FS.readFile(path, (err: Error, data: Buffer) => {
            if (err) reject(err);
            else resolve(data);
        })
    });
}

export function isFile (path: string) {
    return new Promise((resolve: (isFile: boolean) => void, reject: (err: Error) => void) => {
        FS.stat(path, (err: Error, stats: FS.Stats) => {
            if (err) reject(err);
            else resolve(stats.isFile());
        });
    });
}

export function isFileExist (path: string) {
    return new Promise((resolve: (isFile: boolean) => void) => {
        FS.stat(path, (err: Error, stats: FS.Stats) => {
            resolve(!!stats);
        });
    });
}

export function getDirs (dirPath: string): Array<string> {
    const folders = dirPath.replace(/^\/+/, '').replace(/\/+$/, '').split('/');
    
    let nowFolder = '';
    let dirs = new Array<string>();
    
    dirs.push('/');
    for (let folder of folders) {
        nowFolder = nowFolder + '/' + folder;
        dirs.push(nowFolder);
    }
    dirs.pop();

    return dirs;
}

export async function listFiles (rootPath: string, ignore?: Array<string>) {
    return new Promise((resolve: (list: Set<string>) => void, reject: (err?: any) => void) => {
        try {
            let dict = new Set<string>();
            let workingDir = new Map<string, number>(); // 1 - in-queue, 2 - in-progress
    
            const dodo = (p: string) => {
                workingDir.set(p, 2);
                FS.readdir(p, (err: any, list: Array<string>) => {
                    if (err) reject(err);
                    
                    list.forEach((filename: string) => {
                        const path = Path.join(p, filename).replace(/\\/g, '/');
                        const file = FS.statSync(path);
                        const rPath = path.substr(rootPath.length);
                        
                        // 'dict' Would not contain folders.
                        if (!ignore || ignore.indexOf(rPath) === -1) {
                            if (!file.isFile()) {
                                workingDir.set(path, 1);
                            } else {
                                dict.add(rPath);
                            }
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
            
            dodo(rootPath);
        } catch (e) {
            reject(e);
        }
    });
}

export const pathfix = (path: string): string => path.replace(/\\/g, '/');

// Modified from "https://github.com/sindresorhus/strip-json-comments"
// PS：面向 Github 编程什么的真的是不好意思了 >_<
export function stripJsonComments (str, opts?) {
    let singleComment = 1;
    let multiComment = 2;
    
    const stripWithoutWhitespace = () => '';
    
    const stripWithWhitespace = (str, start, end) => str.slice(start, end).replace(/\S/g, ' ');
    
    opts = opts || {};

    let currentChar, nextChar;
    let insideString: any = false;
    let insideComment: any = false;
    let offset = 0;
    let ret = '';
    let strip = opts.whitespace === false ? stripWithoutWhitespace : stripWithWhitespace;

    for (let i = 0; i < str.length; i++) {
        currentChar = str[i];
        nextChar = str[i + 1];

        if (!insideComment && currentChar === '"') {
            let escaped = str[i - 1] === '\\' && str[i - 2] !== '\\';
            if (!escaped) {
                insideString = !insideString;
            }
        }

        if (insideString) {
            continue;
        }

        if (!insideComment && currentChar + nextChar === '//') {
            ret += str.slice(offset, i);
            offset = i;
            insideComment = singleComment;
            i++;
        } else if (insideComment === singleComment && currentChar + nextChar === '\r\n') {
            i++;
            insideComment = false;
            ret += strip(str, offset, i);
            offset = i;
            continue;
        } else if (insideComment === singleComment && currentChar === '\n') {
            insideComment = false;
            ret += strip(str, offset, i);
            offset = i;
        } else if (!insideComment && currentChar + nextChar === '/*') {
            ret += str.slice(offset, i);
            offset = i;
            insideComment = multiComment;
            i++;
            continue;
        } else if (insideComment === multiComment && currentChar + nextChar === '*/') {
            i++;
            insideComment = false;
            ret += strip(str, offset, i + 1);
            offset = i + 1;
            continue;
        }
    }

    return ret + str.substr(offset);
};