import * as vscode from 'vscode';
import { MakefileParser, MakefileSymbolKind } from './makefileParser';

export class MakefileDiagnosticProvider {
    private diagnosticCollection: vscode.DiagnosticCollection;

    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('makefile');
    }

    public provideDiagnostics(document: vscode.TextDocument): void {
        const diagnostics: vscode.Diagnostic[] = [];
        const text = document.getText();
        const lines = text.split('\n');
        
        // Get all symbols for reference checking
        const symbols = MakefileParser.parseDocument(document);
        const variables = symbols.filter(s => s.kind === MakefileSymbolKind.Variable);
        const targets = symbols.filter(s => s.kind === MakefileSymbolKind.Target);
        
        for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
            const line = lines[lineNumber];
            
            // Check for tabs vs spaces in recipe lines
            if (line.startsWith(' ') && !line.startsWith('\t') && line.trim() !== '') {
                // Check if this might be a recipe line (previous line contains a target)
                if (lineNumber > 0) {
                    const prevLine = lines[lineNumber - 1];
                    if (prevLine.includes(':') && !prevLine.trim().startsWith('#')) {
                        const diagnostic = new vscode.Diagnostic(
                            new vscode.Range(lineNumber, 0, lineNumber, line.search(/\S/)),
                            'Recipe lines must start with a tab character, not spaces',
                            vscode.DiagnosticSeverity.Error
                        );
                        diagnostic.code = 'tab-required';
                        diagnostics.push(diagnostic);
                    }
                }
            }
            
            // Check for undefined variables
            const variableRefs = this.findVariableReferences(line);
            variableRefs.forEach(ref => {
                const isDefined = variables.some(v => v.name === ref.name) || 
                                 this.isPredefinedVariable(ref.name);
                
                if (!isDefined) {
                    const diagnostic = new vscode.Diagnostic(
                        new vscode.Range(lineNumber, ref.start, lineNumber, ref.end),
                        `Undefined variable '${ref.name}'`,
                        vscode.DiagnosticSeverity.Warning
                    );
                    diagnostic.code = 'undefined-variable';
                    diagnostics.push(diagnostic);
                }
            });
            
            // Check for potential typos in target dependencies
            if (line.includes(':')) {
                const colonIndex = line.indexOf(':');
                const dependencies = line.substring(colonIndex + 1).trim().split(/\s+/);
                
                dependencies.forEach(dep => {
                    if (dep && !dep.includes('$') && !dep.includes('%') && !dep.includes('.')) {
                        // Check if this dependency exists as a target
                        const targetExists = targets.some(t => t.name === dep);
                        const isFile = dep.includes('/') || dep.includes('.');
                        
                        if (!targetExists && !isFile) {
                            const depStart = line.indexOf(dep, colonIndex);
                            if (depStart >= 0) {
                                const diagnostic = new vscode.Diagnostic(
                                    new vscode.Range(lineNumber, depStart, lineNumber, depStart + dep.length),
                                    `Target '${dep}' is not defined in this Makefile`,
                                    vscode.DiagnosticSeverity.Information
                                );
                                diagnostic.code = 'undefined-target';
                                diagnostics.push(diagnostic);
                            }
                        }
                    }
                });
            }
            
            // Check for unused variables
            if (lineNumber === lines.length - 1) {
                variables.forEach(variable => {
                    const references = MakefileParser.findReferences(document, variable.name);
                    if (references.length === 0) {
                        const diagnostic = new vscode.Diagnostic(
                            variable.range,
                            `Variable '${variable.name}' is defined but never used`,
                            vscode.DiagnosticSeverity.Hint
                        );
                        diagnostic.code = 'unused-variable';
                        diagnostic.tags = [vscode.DiagnosticTag.Unnecessary];
                        diagnostics.push(diagnostic);
                    }
                });
            }
        }
        
        this.diagnosticCollection.set(document.uri, diagnostics);
    }

    private findVariableReferences(line: string): Array<{name: string, start: number, end: number}> {
        const references: Array<{name: string, start: number, end: number}> = [];
        const regex = /\$\(([a-zA-Z_][a-zA-Z0-9_]*)\)/g;
        let match;
        
        while ((match = regex.exec(line)) !== null) {
            references.push({
                name: match[1],
                start: match.index + 2, // Skip "$("
                end: match.index + 2 + match[1].length
            });
        }
        
        return references;
    }

    private isPredefinedVariable(name: string): boolean {
        const predefinedVars = [
            'CC', 'CXX', 'CPP', 'FC', 'PC', 'CO', 'GET', 'LEX', 'YACC',
            'CFLAGS', 'CXXFLAGS', 'CPPFLAGS', 'FFLAGS', 'PFLAGS', 'LDFLAGS',
            'ARFLAGS', 'YFLAGS', 'LFLAGS',
            'MAKE', 'SHELL', 'MAKESHELL', 'MAKEFLAGS', 'MAKECMDGOALS',
            '@', '<', '^', '?', '*', '+', '|'
        ];
        
        return predefinedVars.includes(name);
    }

    public clear(): void {
        this.diagnosticCollection.clear();
    }

    public dispose(): void {
        this.diagnosticCollection.dispose();
    }
}
