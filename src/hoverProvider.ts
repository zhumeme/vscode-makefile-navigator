import * as vscode from 'vscode';
import { MakefileParser, MakefileSymbolKind } from './makefileParser';

export class MakefileHoverProvider implements vscode.HoverProvider {
    
    public provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Hover> {
        
        const symbolName = MakefileParser.findSymbolAtPosition(document, position);
        if (!symbolName) {
            return null;
        }

        // Find the symbol definition
        const symbols = MakefileParser.parseDocument(document);
        const symbol = symbols.find(s => s.name === symbolName);
        
        if (!symbol) {
            return null;
        }

        return this.createHoverInfo(document, symbol, symbolName);
    }

    private createHoverInfo(document: vscode.TextDocument, symbol: any, symbolName: string): vscode.Hover {
        const markdownString = new vscode.MarkdownString();
        
        switch (symbol.kind) {
            case MakefileSymbolKind.Variable:
                markdownString.appendCodeblock(`${symbolName} (Variable)`, 'makefile');
                
                // Try to get the variable value
                const line = document.lineAt(symbol.range.start.line).text;
                const valueMatch = line.match(/=\s*(.+)$/);
                if (valueMatch) {
                    markdownString.appendText(`\n**Value:** \`${valueMatch[1].trim()}\``);
                }
                
                // Find references count
                const references = MakefileParser.findReferences(document, symbolName);
                markdownString.appendText(`\n\n**References:** ${references.length} usage(s) found`);
                break;

            case MakefileSymbolKind.Target:
                markdownString.appendCodeblock(`${symbolName} (Target)`, 'makefile');
                
                // Get target dependencies
                const targetLine = document.lineAt(symbol.range.start.line).text;
                const colonIndex = targetLine.indexOf(':');
                if (colonIndex >= 0) {
                    const dependencies = targetLine.substring(colonIndex + 1).trim();
                    if (dependencies) {
                        markdownString.appendText(`\n**Dependencies:** \`${dependencies}\``);
                    } else {
                        markdownString.appendText(`\n**Dependencies:** None`);
                    }
                }

                // Check if it's a pattern rule
                if (symbolName.includes('%')) {
                    markdownString.appendText(`\n\n**Type:** Pattern Rule`);
                } else {
                    markdownString.appendText(`\n\n**Type:** Explicit Target`);
                }
                break;

            default:
                markdownString.appendCodeblock(symbolName, 'makefile');
                break;
        }

        markdownString.appendText(`\n\n**Location:** Line ${symbol.range.start.line + 1}`);
        
        return new vscode.Hover(markdownString, symbol.range);
    }
}
