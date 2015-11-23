import * as vscode from 'vscode';
import { window, commands, workspace, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument } from 'vscode';
import { Sync } from './Sync';
import { SyncController } from './SyncController';

export function activate(context: ExtensionContext) {
	
	console.log('Congratulations, your extension "sync" is now active!'); 
	
    const syncController = new SyncController();
	
    context.subscriptions.push(syncController);
}
