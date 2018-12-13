import { Terminal } from 'xterm';
export interface ITerminadoAddonTerminal extends Terminal {
    __socket?: WebSocket;
    __attachSocketBuffer?: string;
    __getMessage?(ev: MessageEvent): void;
    __flushBuffer?(): void;
    __pushToBuffer?(data: string): void;
    __sendData?(data: string): void;
    __setSize?(size: {
        rows: number;
        cols: number;
    }): void;
}
