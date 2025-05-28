import * as vscode from 'vscode';
import { MakefileParser, MakefileSymbolKind } from './makefileParser';

export class MakefileDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
    
    public provideDocumentSymbols(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.SymbolInformation[] | vscode.DocumentSymbol[]> {
        
        const symbols = MakefileParser.parseDocument(document);
        
        return symbols.map((symbol: any) => {
            const kind = this.getVSCodeSymbolKind(symbol.kind);
            
            return new vscode.SymbolInformation(
                symbol.name,
                kind,
                '',
                symbol.location
            );
        });
    }

    private getVSCodeSymbolKind(makefileKind: MakefileSymbolKind): vscode.SymbolKind {
        switch (makefileKind) {
            case MakefileSymbolKind.Target:
                return vscode.SymbolKind.Function;
            case MakefileSymbolKind.Variable:
                return vscode.SymbolKind.Variable;
            case MakefileSymbolKind.Function:
                return vscode.SymbolKind.Method;
            default:
                return vscode.SymbolKind.Object;
        }
    }
}
