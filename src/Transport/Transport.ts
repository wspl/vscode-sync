import * as SFTP from './SFTP';


export interface SyncServer extends JSON {}

export interface TransportClient {
	isConected: boolean;
	connect(server: SyncServer): Promise<any>;
	disconnect (): Promise<any>;
	listFiles (path: string): Promise<any>;
	mkdir (dirPath: string): Promise<any>;
	put (localPath: string, remotePath: string, progress?: (percentage: number) => void): Promise<any>;
	get (remotePath: string, localPath: string, progress?: (percentage: number) => void): Promise<any>;
	unlink (remotePath: string): Promise<any>;
	rmdir (remotePath: string): Promise<any>;
}

export interface SyncPath extends Object {
	name: string;
	path: string;
	dirname: string;
	type: PathType;
}
	
export enum PathType {
	'File', 'Folder'
}

export var Transports = new Map<string, TransportClient>([
	['SFTP', new SFTP.Client()]
]);