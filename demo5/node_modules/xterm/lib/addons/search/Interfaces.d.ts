import { Terminal } from 'xterm';
export interface ITerminalCore {
    buffer: any;
    selectionManager: any;
}
export interface ISearchAddonTerminal extends Terminal {
    __searchHelper?: ISearchHelper;
    _core: ITerminalCore;
}
export interface ISearchHelper {
    findNext(term: string, searchOptions: ISearchOptions): boolean;
    findPrevious(term: string, searchOptions: ISearchOptions): boolean;
}
export interface ISearchOptions {
    regex?: boolean;
    wholeWord?: boolean;
    caseSensitive?: boolean;
}
export interface ISearchResult {
    term: string;
    col: number;
    row: number;
}
