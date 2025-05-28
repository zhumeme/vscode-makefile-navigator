import * as assert from 'assert';
import * as vscode from 'vscode';
import { MakefileReferenceProvider } from '../referenceProvider';
import { MakefileDefinitionProvider } from '../definitionProvider';
import { MakefileParser } from '../makefileParser';

// Create a simple cancellation token for testing
const createCancellationToken = (): vscode.CancellationToken => ({
    isCancellationRequested: false,
    onCancellationRequested: () => ({ dispose: () => {} })
} as vscode.CancellationToken);

suite('Makefile Reference Provider Test Suite', () => {
    vscode.window.showInformationMessage('Start Makefile Reference Provider tests.');

    test('Find Variable References', async () => {
        const referenceProvider = new MakefileReferenceProvider();
        
        const content = `CC = gcc
CFLAGS = -Wall -g
LDFLAGS = -lm

all: main.o utils.o
\t$(CC) $(CFLAGS) -o myapp main.o utils.o $(LDFLAGS)

main.o: main.c
\t$(CC) $(CFLAGS) -c main.c

clean:
\trm -f *.o myapp
`;
        
        const document = await vscode.workspace.openTextDocument({
            content: content,
            language: 'makefile'
        });
        
        // Test finding references to CC variable (position at CC in line 0)
        const position = new vscode.Position(0, 0); // Position at 'CC' in 'CC = gcc'
        
        // First check if we can find the symbol at position
        const symbolName = MakefileParser.findSymbolAtPosition(document, position);
        console.log('Symbol found at position:', symbolName);
        assert.ok(symbolName, 'Should find symbol at position');
        assert.strictEqual(symbolName, 'CC', 'Should find CC symbol');
        
        const context: vscode.ReferenceContext = { includeDeclaration: true };
        
        const references = await referenceProvider.provideReferences(
            document,
            position,
            context,
            createCancellationToken()
        ) as vscode.Location[];
        
        console.log('References returned:', references ? references.length : 'null');
        
        assert.ok(references, 'References should be found');
        assert.ok(references.length >= 3, `Expected at least 3 references (declaration + 2 usages), got ${references.length}`);
        
        // Check that references are at expected positions
        const referencePositions = references.map(ref => ({
            line: ref.range.start.line,
            character: ref.range.start.character
        }));
        
        console.log('CC references found at:', referencePositions);
        
        // Should find declaration at line 0
        const hasDeclaration = referencePositions.some(pos => pos.line === 0);
        assert.ok(hasDeclaration, 'Should include declaration');
        
        // Should find usage in line 5 ($(CC))
        const hasUsageInAll = referencePositions.some(pos => pos.line === 5);
        assert.ok(hasUsageInAll, 'Should find usage in all target');
        
        // Should find usage in line 8 ($(CC))
        const hasUsageInMainO = referencePositions.some(pos => pos.line === 8);
        assert.ok(hasUsageInMainO, 'Should find usage in main.o target');
    });

    test('Find Target References', async () => {
        const referenceProvider = new MakefileReferenceProvider();
        
        const content = `all: main.o utils.o clean
\techo "Building all"

main.o: main.c
\tgcc -c main.c

utils.o: utils.c
\tgcc -c utils.c

clean:
\trm -f *.o

.PHONY: all clean

test: all
\t./myapp
`;
        
        const document = await vscode.workspace.openTextDocument({
            content: content,
            language: 'makefile'
        });
        
        // Test finding references to 'all' target
        const position = new vscode.Position(0, 0); // Position at 'all' in first line
        const context: vscode.ReferenceContext = { includeDeclaration: true };
        
        const references = await referenceProvider.provideReferences(
            document,
            position,
            context,
            createCancellationToken()
        ) as vscode.Location[];
        
        assert.ok(references, 'References should be found');
        console.log('Target "all" references:', references.length);
        
        // Should find at least: declaration + .PHONY reference + dependency in test
        assert.ok(references.length >= 3, `Expected at least 3 references for "all", got ${references.length}`);
        
        const referencePositions = references.map(ref => ({
            line: ref.range.start.line,
            character: ref.range.start.character,
            text: document.getText(ref.range)
        }));
        
        console.log('All target references found at:', referencePositions);
    });

    test('Find References Without Declaration', async () => {
        const referenceProvider = new MakefileReferenceProvider();
        
        const content = `CC = gcc
CFLAGS = -Wall

main: main.o
\t$(CC) $(CFLAGS) -o main main.o
`;
        
        const document = await vscode.workspace.openTextDocument({
            content: content,
            language: 'makefile'
        });
        
        // Test finding references to CC without including declaration
        const position = new vscode.Position(4, 3); // Position at 'CC' in $(CC)
        const context: vscode.ReferenceContext = { includeDeclaration: false };
        
        const references = await referenceProvider.provideReferences(
            document,
            position,
            context,
            createCancellationToken()
        ) as vscode.Location[];
        
        assert.ok(references, 'References should be found');
        
        // Should only find usage, not declaration
        assert.strictEqual(references.length, 1, `Expected 1 reference (usage only), got ${references.length}`);
        
        // The reference should be the usage in line 4
        assert.strictEqual(references[0].range.start.line, 4, 'Reference should be in line 4');
    });

    test('Parser findSymbolAtPosition - Variable Reference', () => {
        const content = `CC = gcc
main: main.o
\t$(CC) -o main main.o
`;
        
        const document = {
            lineAt: (line: number) => ({ text: content.split('\n')[line] }),
            getWordRangeAtPosition: (position: vscode.Position, regex?: RegExp) => {
                const line = content.split('\n')[position.line];
                const match = regex ? regex.exec(line.substring(position.character)) : null;
                if (match) {
                    return new vscode.Range(
                        position.line, position.character,
                        position.line, position.character + match[0].length
                    );
                }
                // Simple word detection
                const char = line[position.character];
                if (/[a-zA-Z0-9_]/.test(char)) {
                    let start = position.character;
                    let end = position.character;
                    while (start > 0 && /[a-zA-Z0-9_]/.test(line[start - 1])) {
                        start--;
                    }
                    while (end < line.length && /[a-zA-Z0-9_]/.test(line[end])) {
                        end++;
                    }
                    return new vscode.Range(position.line, start, position.line, end);
                }
                return null;
            },
            getText: (range?: vscode.Range) => {
                if (!range) {
                    return content;
                }
                const lines = content.split('\n');
                const line = lines[range.start.line];
                return line.substring(range.start.character, range.end.character);
            }
        } as any;
        
        // Test finding symbol at position in $(CC)
        const position = new vscode.Position(2, 3); // Position at 'C' in $(CC)
        const symbol = MakefileParser.findSymbolAtPosition(document, position);
        
        assert.strictEqual(symbol, 'CC', 'Should find CC variable in $(CC)');
    });

    test('Parser findReferences - Variable', () => {
        const content = `CC = gcc
CFLAGS = -Wall

main: main.o
\t$(CC) $(CFLAGS) -o main main.o
\t$(CC) $(CFLAGS) -c main.c
`;
        
        const document = {
            uri: vscode.Uri.file('/test/Makefile'),
            getText: () => content
        } as any;
        
        const references = MakefileParser.findReferences(document, 'CC');
        
        assert.ok(references.length >= 2, `Expected at least 2 references for CC, got ${references.length}`);
        
        // Check positions
        const positions = references.map(ref => ({ line: ref.range.start.line, char: ref.range.start.character }));
        console.log('CC references in parser test:', positions);
        
        // Should find $(CC) in lines 4 and 5
        const line4Ref = positions.find(pos => pos.line === 4);
        const line5Ref = positions.find(pos => pos.line === 5);
        
        assert.ok(line4Ref, 'Should find reference in line 4');
        assert.ok(line5Ref, 'Should find reference in line 5');
    });

    test('Integration: Definition to References Flow', async () => {
        const definitionProvider = new MakefileDefinitionProvider();
        const referenceProvider = new MakefileReferenceProvider();
        
        const content = `CC = gcc
CFLAGS = -Wall -g

all: main.o
\t$(CC) $(CFLAGS) -o myapp main.o

main.o: main.c
\t$(CC) $(CFLAGS) -c main.c
`;
        
        const document = await vscode.workspace.openTextDocument({
            content: content,
            language: 'makefile'
        });
        
        // Step 1: Go to definition from a usage
        const usagePosition = new vscode.Position(4, 3); // Position at 'CC' in $(CC)
        const definition = await definitionProvider.provideDefinition(
            document,
            usagePosition,
            createCancellationToken()
        ) as vscode.Location;
        
        assert.ok(definition, 'Should find definition');
        assert.strictEqual(definition.range.start.line, 0, 'Definition should be in line 0');
        
        // Step 2: Find all references from the definition
        const definitionPosition = new vscode.Position(0, 0); // Position at definition
        const context: vscode.ReferenceContext = { includeDeclaration: true };
        
        const references = await referenceProvider.provideReferences(
            document,
            definitionPosition,
            context,
            createCancellationToken()
        ) as vscode.Location[];
        
        assert.ok(references, 'Should find references from definition');
        assert.ok(references.length >= 3, `Expected at least 3 references (declaration + 2 usages), got ${references.length}`);
        
        console.log('Integration test - references from definition:', references.map(ref => ({
            line: ref.range.start.line,
            char: ref.range.start.character
        })));
    });
});
