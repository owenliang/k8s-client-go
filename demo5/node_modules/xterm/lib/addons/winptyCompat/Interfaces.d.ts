import { Terminal } from 'xterm';
export interface ITerminalCore {
    buffer: any;
}
export interface IWinptyCompatAddonTerminal extends Terminal {
    _core: ITerminalCore;
}
