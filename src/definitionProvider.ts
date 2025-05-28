import * as vscode from 'vscode';
import { MakefileParser } from './makefileParser';

export class MakefileDefinitionProvider implements vscode.DefinitionProvider {
    
    public provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Definition | vscode.DefinitionLink[]> {
        
        const symbolName = MakefileParser.findSymbolAtPosition(document, position);
        if (!symbolName) {
            return null;
        }

        // First, search in the current document
        const symbols = MakefileParser.parseDocument(document);
        const matchingSymbol = symbols.find((symbol: any) => symbol.name === symbolName);
        
        if (matchingSymbol) {
            return matchingSymbol.location;
        }

        // If not found in current document, search in workspace
        return this.searchInWorkspace(symbolName);
    }

    private async searchInWorkspace(symbolName: string): Promise<vscode.Location[]> {
        const makefileUris = await vscode.workspace.findFiles('**/Makefile', '**/node_modules/**');
        const locations: vscode.Location[] = [];

        for (const uri of makefileUris) {
            try {
                const document = await vscode.workspace.openTextDocument(uri);
                const symbols = MakefileParser.parseDocument(document);
                const matchingSymbol = symbols.find((symbol: any) => symbol.name === symbolName);
                
                if (matchingSymbol) {
                    locations.push(matchingSymbol.location);
                }
            } catch (error) {
                console.error(`Error parsing ${uri.fsPath}:`, error);
            }
        }

        return locations;
    }
}
