import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { MakefileParser, MakefileSymbolKind } from '../makefileParser';
// import { MakefileHoverProvider } from '../hoverProvider';
// import { MakefileCompletionProvider } from '../completionProvider';

suite('Makefile Navigator Integration Tests', () => {
    
    test('Parse complex Makefile with many variables and targets', async () => {
        // Create a complex makefile content for testing
        const complexContent = `# Variables
CC = gcc
CXX = g++
CFLAGS = -Wall -Werror
TARGET = myapp
SRCDIR = src

# Targets
all: \$(TARGET)

\$(TARGET): main.o
\t\$(CC) main.o -o \$@

main.o: main.c
\t\$(CC) \$(CFLAGS) -c main.c

clean:
\trm -f *.o \$(TARGET)

.PHONY: all clean`;

        const document = await vscode.workspace.openTextDocument({
            content: complexContent,
            language: 'makefile'
        });

        const symbols = MakefileParser.parseDocument(document);

        // Count different symbol types
        const variables = symbols.filter(s => s.kind === MakefileSymbolKind.Variable);
        const targets = symbols.filter(s => s.kind === MakefileSymbolKind.Target);

        console.log(`Found ${variables.length} variables and ${targets.length} targets`);

        // Should find variables
        const variableNames = variables.map(v => v.name);
        assert.ok(variableNames.includes('CC'));
        assert.ok(variableNames.includes('CXX'));
        assert.ok(variableNames.includes('CFLAGS'));
        assert.ok(variableNames.includes('TARGET'));

        // Should find targets
        const targetNames = targets.map(t => t.name);
        assert.ok(targetNames.includes('all'));
        assert.ok(targetNames.includes('clean'));
    });

    test('Handle edge cases in symbol detection', async () => {
        const content = `# Test edge cases
VAR_WITH_UNDERSCORES = value
VAR-WITH-DASHES = value
123INVALID_VAR = value
_VALID_VAR = value

target-with-dashes: dependency
\ttab command

target_with_underscores: \$(VAR_WITH_UNDERSCORES)

# Pattern rule
%.o: %.c
\t\$(CC) -c \$< -o \$@

.PHONY: target-with-dashes target_with_underscores`;

        const document = await vscode.workspace.openTextDocument({
            content,
            language: 'makefile'
        });

        const symbols = MakefileParser.parseDocument(document);
        const variables = symbols.filter(s => s.kind === MakefileSymbolKind.Variable);
        const targets = symbols.filter(s => s.kind === MakefileSymbolKind.Target);

        console.log('Edge case variables:', variables.map(v => v.name));
        console.log('Edge case targets:', targets.map(t => t.name));

        // Should find valid variables
        const varNames = variables.map(v => v.name);
        assert.ok(varNames.includes('VAR_WITH_UNDERSCORES'));
        assert.ok(varNames.includes('_VALID_VAR'));
        // Should not find invalid variable starting with number
        assert.ok(!varNames.includes('123INVALID_VAR'));

        // Should find targets with different naming conventions
        const targetNames = targets.map(t => t.name);
        assert.ok(targetNames.includes('target-with-dashes'));
        assert.ok(targetNames.includes('target_with_underscores'));
        assert.ok(targetNames.includes('%.o')); // Pattern rule

        // Should not have duplicates from .PHONY
        const targetCounts = targetNames.reduce((acc: any, name) => {
            acc[name] = (acc[name] || 0) + 1;
            return acc;
        }, {});
        
        Object.keys(targetCounts).forEach(name => {
            assert.strictEqual(targetCounts[name], 1, `Target ${name} should appear only once`);
        });
    });

    // Temporarily disabled - new features being added
    /*
    test('Hover provider shows useful information', async () => {
        const content = `CC = gcc
CFLAGS = -Wall -Werror
TARGET = myapp

all: \$(TARGET)
\t\$(CC) -o \$@ main.o

%.o: %.c
\t\$(CC) \$(CFLAGS) -c \$< -o \$@`;

        const document = await vscode.workspace.openTextDocument({
            content,
            language: 'makefile'
        });

        const hoverProvider = new MakefileHoverProvider();

        // Test hover on variable
        const variablePosition = new vscode.Position(0, 0); // Position of "CC"
        const variableHover = await hoverProvider.provideHover(
            document, 
            variablePosition, 
            new vscode.CancellationTokenSource().token
        );

        assert.ok(variableHover);
        assert.ok(variableHover.contents.length > 0);
        console.log('Variable hover:', variableHover.contents[0]);

        // Test hover on target
        const targetPosition = new vscode.Position(4, 0); // Position of "all"
        const targetHover = await hoverProvider.provideHover(
            document, 
            targetPosition, 
            new vscode.CancellationTokenSource().token
        );

        assert.ok(targetHover);
        assert.ok(targetHover.contents.length > 0);
        console.log('Target hover:', targetHover.contents[0]);
    });

    test('Completion provider suggests variables and targets', async () => {
        const content = `CC = gcc
CFLAGS = -Wall
TARGET = myapp

all: main.o
\t\$(CC) -o \$(TARGET) main.o

test: \$(`;

        const document = await vscode.workspace.openTextDocument({
            content,
            language: 'makefile'
        });

        const completionProvider = new MakefileCompletionProvider();

        // Test variable completion in $( context
        const variablePosition = new vscode.Position(7, 8); // After "$("
        const variableCompletions = await completionProvider.provideCompletionItems(
            document,
            variablePosition,
            new vscode.CancellationTokenSource().token,
            { triggerKind: vscode.CompletionTriggerKind.TriggerCharacter, triggerCharacter: '(' }
        );

        assert.ok(variableCompletions);
        const completionItems = Array.isArray(variableCompletions) ? variableCompletions : variableCompletions.items;
        
        // Should include user-defined variables
        const variableNames = completionItems.map((item: any) => item.label);
        assert.ok(variableNames.includes('CC'));
        assert.ok(variableNames.includes('CFLAGS'));
        assert.ok(variableNames.includes('TARGET'));

        console.log('Variable completions:', variableNames.slice(0, 5));
    });
    */
});
