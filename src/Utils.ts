import * as FS from 'fs';
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

// Modified by "https://github.com/sindresorhus/strip-json-comments"
export function stripJsonComments (str, opts?) {
    let singleComment = 1;
    let multiComment = 2;
    
    const stripWithoutWhitespace = () => {
        return '';
    }
    
    const stripWithWhitespace = (str, start, end) => {
        return str.slice(start, end).replace(/\S/g, ' ');
    }
    
    opts = opts || {};

    let currentChar;
    let nextChar;
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