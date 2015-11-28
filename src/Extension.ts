import * as vscode from 'vscode';
import { window, commands, workspace, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument } from 'vscode';
import { SyncController } from './SyncController';

export function activate(context: ExtensionContext) {
    SyncController.init();
    context.subscriptions.push(SyncController);
}