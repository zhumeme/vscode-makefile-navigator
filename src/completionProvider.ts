import * as vscode from 'vscode';
import { MakefileParser, MakefileSymbolKind } from './makefileParser';

export class MakefileCompletionProvider implements vscode.CompletionItemProvider {
    
    public provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
        
        const line = document.lineAt(position.line).text;
        const beforeCursor = line.substring(0, position.character);
        
        // Check if we're in a variable reference $(...)
        if (beforeCursor.endsWith('$(') || /\$\([a-zA-Z_]*$/.test(beforeCursor)) {
            return this.provideVariableCompletions(document);
        }
        
        // Check if we're in a dependency list (after colon)
        const colonIndex = beforeCursor.indexOf(':');
        if (colonIndex >= 0 && colonIndex < beforeCursor.length - 1) {
            return this.provideTargetCompletions(document);
        }
        
        // Provide general completions
        return this.provideGeneralCompletions(document);
    }

    private provideVariableCompletions(document: vscode.TextDocument): vscode.CompletionItem[] {
        const symbols = MakefileParser.parseDocument(document);
        const variables = symbols.filter(s => s.kind === MakefileSymbolKind.Variable);
        
        const completions: vscode.CompletionItem[] = [];
        
        // Add user-defined variables
        variables.forEach(variable => {
            const completion = new vscode.CompletionItem(variable.name, vscode.CompletionItemKind.Variable);
            completion.detail = 'User-defined variable';
            completion.insertText = variable.name + ')';
            completions.push(completion);
        });
        
        // Add common predefined variables
        const predefinedVars = [
            { name: 'CC', description: 'C compiler command' },
            { name: 'CXX', description: 'C++ compiler command' },
            { name: 'CFLAGS', description: 'C compiler flags' },
            { name: 'CXXFLAGS', description: 'C++ compiler flags' },
            { name: 'LDFLAGS', description: 'Linker flags' },
            { name: 'MAKE', description: 'Make command' },
            { name: 'SHELL', description: 'Shell to use' },
            { name: '@', description: 'Target name' },
            { name: '<', description: 'First prerequisite' },
            { name: '^', description: 'All prerequisites' },
            { name: '?', description: 'Prerequisites newer than target' }
        ];
        
        predefinedVars.forEach(variable => {
            const completion = new vscode.CompletionItem(variable.name, vscode.CompletionItemKind.Variable);
            completion.detail = variable.description;
            completion.insertText = variable.name + ')';
            completions.push(completion);
        });
        
        return completions;
    }

    private provideTargetCompletions(document: vscode.TextDocument): vscode.CompletionItem[] {
        const symbols = MakefileParser.parseDocument(document);
        const targets = symbols.filter(s => s.kind === MakefileSymbolKind.Target);
        
        return targets.map(target => {
            const completion = new vscode.CompletionItem(target.name, vscode.CompletionItemKind.Function);
            completion.detail = 'Makefile target';
            
            // Don't include pattern rules in target completions for dependencies
            if (target.name.includes('%')) {
                completion.detail = 'Pattern rule (may not be suitable as dependency)';
                completion.sortText = 'z' + target.name; // Sort pattern rules to bottom
            }
            
            return completion;
        });
    }

    private provideGeneralCompletions(document: vscode.TextDocument): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];
        
        // Add common Makefile directives
        const directives = [
            { name: '.PHONY', description: 'Declare phony targets' },
            { name: '.DEFAULT', description: 'Default target for unmatched files' },
            { name: '.PRECIOUS', description: 'Preserve intermediate files' },
            { name: '.INTERMEDIATE', description: 'Mark targets as intermediate' },
            { name: '.SECONDARY', description: 'Mark targets as secondary' },
            { name: '.DELETE_ON_ERROR', description: 'Delete targets on command failure' },
            { name: '.IGNORE', description: 'Ignore errors in commands' },
            { name: '.SILENT', description: 'Silent execution of commands' },
            { name: '.EXPORT_ALL_VARIABLES', description: 'Export all variables to sub-makes' }
        ];
        
        directives.forEach(directive => {
            const completion = new vscode.CompletionItem(directive.name, vscode.CompletionItemKind.Keyword);
            completion.detail = directive.description;
            completion.insertText = directive.name + ': ';
            completions.push(completion);
        });
        
        // Add common functions
        const functions = [
            { name: 'wildcard', description: 'Find files matching pattern', syntax: '$(wildcard pattern)' },
            { name: 'patsubst', description: 'Pattern substitution', syntax: '$(patsubst pattern,replacement,text)' },
            { name: 'subst', description: 'Text substitution', syntax: '$(subst from,to,text)' },
            { name: 'filter', description: 'Filter words matching patterns', syntax: '$(filter pattern,text)' },
            { name: 'filter-out', description: 'Filter out words matching patterns', syntax: '$(filter-out pattern,text)' },
            { name: 'sort', description: 'Sort words', syntax: '$(sort list)' },
            { name: 'dir', description: 'Directory part of filenames', syntax: '$(dir names)' },
            { name: 'notdir', description: 'Non-directory part of filenames', syntax: '$(notdir names)' },
            { name: 'basename', description: 'Remove suffix from filenames', syntax: '$(basename names)' },
            { name: 'addsuffix', description: 'Add suffix to words', syntax: '$(addsuffix suffix,names)' },
            { name: 'addprefix', description: 'Add prefix to words', syntax: '$(addprefix prefix,names)' }
        ];
        
        functions.forEach(func => {
            const completion = new vscode.CompletionItem(func.name, vscode.CompletionItemKind.Function);
            completion.detail = func.description;
            completion.documentation = func.syntax;
            completion.insertText = func.name;
            completions.push(completion);
        });
        
        return completions;
    }
}
