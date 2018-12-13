import { ISearchHelper, ISearchAddonTerminal, ISearchOptions, ISearchResult } from './Interfaces';
export declare class SearchHelper implements ISearchHelper {
    private _terminal;
    constructor(_terminal: ISearchAddonTerminal);
    findNext(term: string, searchOptions?: ISearchOptions): boolean;
    findPrevious(term: string, searchOptions?: ISearchOptions): boolean;
    private _isWholeWord;
    protected _findInLine(term: string, y: number, searchOptions?: ISearchOptions): ISearchResult;
    translateBufferLineToStringWithWrap(lineIndex: number, trimRight: boolean): string;
    private _selectResult;
}
