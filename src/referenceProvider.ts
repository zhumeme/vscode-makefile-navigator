import * as vscode from 'vscode';
import { MakefileParser } from './makefileParser';

export class MakefileReferenceProvider implements vscode.ReferenceProvider {
    
    public provideReferences(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.ReferenceContext,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Location[]> {
        
        const symbolName = MakefileParser.findSymbolAtPosition(document, position);
        if (!symbolName) {
            return [];
        }

        return this.findAllReferences(document, symbolName, context.includeDeclaration);
    }

    private async findAllReferences(currentDocument: vscode.TextDocument, symbolName: string, includeDeclaration: boolean): Promise<vscode.Location[]> {
        const allReferences: vscode.Location[] = [];

        // First, find references in the current document
        const currentReferences = MakefileParser.findReferences(currentDocument, symbolName);
        allReferences.push(...currentReferences);

        // Include declaration if requested and found in current document
        if (includeDeclaration) {
            const symbols = MakefileParser.parseDocument(currentDocument);
            const declaration = symbols.find((symbol: any) => symbol.name === symbolName);
            if (declaration) {
                allReferences.push(declaration.location);
            }
        }

        // Then search in other Makefile files in the workspace
        const makefileUris = await vscode.workspace.findFiles('**/Makefile', '**/node_modules/**');
        
        for (const uri of makefileUris) {
            // Skip the current document if it's already a file (to avoid duplicates)
            if (currentDocument.uri.scheme === 'file' && uri.fsPath === currentDocument.uri.fsPath) {
                continue;
            }

            try {
                const document = await vscode.workspace.openTextDocument(uri);
                
                // Find references in this document
                const references = MakefileParser.findReferences(document, symbolName);
                allReferences.push(...references);

                // Include declaration if requested and not already found
                if (includeDeclaration) {
                    const symbols = MakefileParser.parseDocument(document);
                    const declaration = symbols.find((symbol: any) => symbol.name === symbolName);
                    if (declaration) {
                        // Check if we already have this declaration (avoid duplicates)
                        const alreadyExists = allReferences.some(ref => 
                            ref.uri.fsPath === declaration.location.uri.fsPath &&
                            ref.range.start.line === declaration.location.range.start.line &&
                            ref.range.start.character === declaration.location.range.start.character
                        );
                        if (!alreadyExists) {
                            allReferences.push(declaration.location);
                        }
                    }
                }
            } catch (error) {
                console.error(`Error finding references in ${uri.fsPath}:`, error);
            }
        }

        return allReferences;
    }
}
