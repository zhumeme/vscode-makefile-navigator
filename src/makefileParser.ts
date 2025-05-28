import * as vscode from 'vscode';

export interface MakefileSymbol {
    name: string;
    kind: MakefileSymbolKind;
    location: vscode.Location;
    range: vscode.Range;
}

export enum MakefileSymbolKind {
    Target = 'target',
    Variable = 'variable',
    Function = 'function'
}

export class MakefileParser {
    private static readonly TARGET_REGEX = /^([a-zA-Z0-9_.\-/]+)\s*:\s*/;
    private static readonly VARIABLE_ASSIGNMENT_REGEX = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*[:+?]?=\s*/;
    private static readonly VARIABLE_REFERENCE_REGEX = /\$\(([a-zA-Z_][a-zA-Z0-9_]*)\)/g;
    private static readonly PHONY_REGEX = /^\.PHONY\s*:\s*(.+)$/;
    // Support for pattern rules like %.o: %.c
    private static readonly PATTERN_TARGET_REGEX = /^([a-zA-Z0-9_.\-/%]+)\s*:\s*/;

    public static parseDocument(document: vscode.TextDocument): MakefileSymbol[] {
        const symbols: MakefileSymbol[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
            const line = lines[lineNumber];
            const trimmedLine = line.trim();

            // Skip comments and empty lines
            if (trimmedLine.startsWith('#') || trimmedLine === '') {
                continue;
            }

            // Skip .PHONY declarations - they reference targets, don't define them
            const phonyMatch = this.PHONY_REGEX.exec(trimmedLine);
            if (phonyMatch) {
                continue;
            }

            // Parse targets (including pattern rules)
            const targetMatch = this.PATTERN_TARGET_REGEX.exec(line);
            if (targetMatch) {
                const targetName = targetMatch[1];
                const startPos = line.indexOf(targetName);
                const range = new vscode.Range(
                    lineNumber, startPos,
                    lineNumber, startPos + targetName.length
                );
                const location = new vscode.Location(document.uri, range);

                symbols.push({
                    name: targetName,
                    kind: MakefileSymbolKind.Target,
                    location,
                    range
                });
            }

            // Parse variable assignments
            const variableMatch = this.VARIABLE_ASSIGNMENT_REGEX.exec(line);
            if (variableMatch) {
                const variableName = variableMatch[1];
                const startPos = line.indexOf(variableName);
                const range = new vscode.Range(
                    lineNumber, startPos,
                    lineNumber, startPos + variableName.length
                );
                const location = new vscode.Location(document.uri, range);

                symbols.push({
                    name: variableName,
                    kind: MakefileSymbolKind.Variable,
                    location,
                    range
                });
            }
        }

        return symbols;
    }

    public static findSymbolAtPosition(document: vscode.TextDocument, position: vscode.Position): string | null {
        const line = document.lineAt(position.line).text;
        const wordRange = document.getWordRangeAtPosition(position, /[a-zA-Z0-9_.\-/]+/);
        
        if (!wordRange) {
            return null;
        }

        const word = document.getText(wordRange);
        
        // Check if we're in a variable reference like $(VAR)
        const beforeCursor = line.substring(0, position.character);
        const afterCursor = line.substring(position.character);
        
        // Variable reference pattern $(VAR)
        if (beforeCursor.includes('$(') && afterCursor.includes(')')) {
            // Find the variable name within $(...)
            const varStartIndex = beforeCursor.lastIndexOf('$(');
            const varEndIndex = line.indexOf(')', varStartIndex);
            if (varEndIndex > varStartIndex) {
                const varContent = line.substring(varStartIndex + 2, varEndIndex);
                if (position.character >= varStartIndex + 2 && position.character <= varEndIndex) {
                    return varContent;
                }
            }
        }

        // Check for target or dependency context
        const colonIndex = line.indexOf(':');
        if (colonIndex >= 0) {
            if (position.character < colonIndex) {
                // We're before the colon, this is a target
                return word;
            } else {
                // We're after the colon, this could be a dependency
                return word;
            }
        }

        // Check for variable assignment context
        const assignmentMatch = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*[:+?]?=/.exec(line);
        if (assignmentMatch && position.character <= assignmentMatch[1].length) {
            return assignmentMatch[1];
        }

        return word;
    }

    public static findReferences(document: vscode.TextDocument, symbolName: string): vscode.Location[] {
        const references: vscode.Location[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
            const line = lines[lineNumber];

            // Find variable references like $(VAR)
            const variableRefRegex = new RegExp(`\\$\\(${this.escapeRegExp(symbolName)}\\)`, 'g');
            let match;
            while ((match = variableRefRegex.exec(line)) !== null) {
                const startPos = match.index + 2; // Skip "$("
                const range = new vscode.Range(
                    lineNumber, startPos,
                    lineNumber, startPos + symbolName.length
                );
                references.push(new vscode.Location(document.uri, range));
            }

            // Find target references (dependencies only, not in variable assignments)
            // Skip variable assignment lines
            const assignmentRegex = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*[:+?]?=\s*/;
            if (assignmentRegex.test(line.trim())) {
                continue;
            }

            // Find target references in dependencies (after colon)
            const colonIndex = line.indexOf(':');
            if (colonIndex >= 0) {
                const dependenciesPart = line.substring(colonIndex + 1);
                const targetRefRegex = new RegExp(`\\b${this.escapeRegExp(symbolName)}\\b`, 'g');
                let targetMatch;
                while ((targetMatch = targetRefRegex.exec(dependenciesPart)) !== null) {
                    const actualStartPos = colonIndex + 1 + targetMatch.index;
                    const range = new vscode.Range(
                        lineNumber, actualStartPos,
                        lineNumber, actualStartPos + symbolName.length
                    );
                    references.push(new vscode.Location(document.uri, range));
                }
            }

            // Find in .PHONY declarations
            const phonyRegex = /^\.PHONY\s*:\s*(.+)$/;
            const phonyMatch = phonyRegex.exec(line.trim());
            if (phonyMatch) {
                const phonyTargets = phonyMatch[1].split(/\s+/);
                phonyTargets.forEach(target => {
                    if (target === symbolName) {
                        const startPos = line.indexOf(target);
                        if (startPos >= 0) {
                            const range = new vscode.Range(
                                lineNumber, startPos,
                                lineNumber, startPos + symbolName.length
                            );
                            references.push(new vscode.Location(document.uri, range));
                        }
                    }
                });
            }
        }

        return references;
    }

    private static escapeRegExp(string: string): string {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}
