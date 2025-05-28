import * as assert from 'assert';
import * as vscode from 'vscode';
import { MakefileParser, MakefileSymbolKind } from '../makefileParser';

suite('Makefile Navigator Extension Tests', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Parse simple Makefile targets', async () => {
		const content = `all: main.o
	gcc -o myapp main.o

main.o: main.c
	gcc -c main.c

clean:
	rm -f *.o myapp`;

		const document = await vscode.workspace.openTextDocument({
			content,
			language: 'makefile'
		});

		const symbols = MakefileParser.parseDocument(document);
		
		assert.strictEqual(symbols.length, 3);
		assert.strictEqual(symbols[0].name, 'all');
		assert.strictEqual(symbols[0].kind, MakefileSymbolKind.Target);
		assert.strictEqual(symbols[1].name, 'main.o');
		assert.strictEqual(symbols[1].kind, MakefileSymbolKind.Target);
		assert.strictEqual(symbols[2].name, 'clean');
		assert.strictEqual(symbols[2].kind, MakefileSymbolKind.Target);
	});

	test('Parse Makefile variables', async () => {
		const content = `CC = gcc
CFLAGS = -Wall -Werror
SRCDIR = src

all: main.o
	$(CC) $(CFLAGS) -o myapp main.o`;

		const document = await vscode.workspace.openTextDocument({
			content,
			language: 'makefile'
		});

		const symbols = MakefileParser.parseDocument(document);
		
		// Should find 3 variables + 1 target
		const variables = symbols.filter(s => s.kind === MakefileSymbolKind.Variable);
		const targets = symbols.filter(s => s.kind === MakefileSymbolKind.Target);
		
		assert.strictEqual(variables.length, 3);
		assert.strictEqual(targets.length, 1);
		assert.strictEqual(variables[0].name, 'CC');
		assert.strictEqual(variables[1].name, 'CFLAGS');
		assert.strictEqual(variables[2].name, 'SRCDIR');
	});

	test('Find variable references', async () => {
		const content = `CC = gcc
CFLAGS = -Wall

all: main.o
	$(CC) $(CFLAGS) -o myapp main.o
	$(CC) -c main.c`;

		const document = await vscode.workspace.openTextDocument({
			content,
			language: 'makefile'
		});

		const references = MakefileParser.findReferences(document, 'CC');
		
		// Debug: log the references found
		console.log('References found for CC:', references.length);
		references.forEach((ref, index) => {
			const line = document.lineAt(ref.range.start.line).text;
			console.log(`Reference ${index + 1}: Line ${ref.range.start.line}, "${line}"`);
		});
		
		// Should find 2 references: $(CC) appears twice
		assert.strictEqual(references.length, 2);
	});

	test('Find symbol at position', async () => {
		const content = `CC = gcc
all: main.o
	$(CC) -o myapp main.o`;

		const document = await vscode.workspace.openTextDocument({
			content,
			language: 'makefile'
		});

		// Test finding variable in reference
		const position1 = new vscode.Position(2, 3); // Inside $(CC)
		const symbol1 = MakefileParser.findSymbolAtPosition(document, position1);
		assert.strictEqual(symbol1, 'CC');

		// Test finding target
		const position2 = new vscode.Position(1, 0); // At 'all'
		const symbol2 = MakefileParser.findSymbolAtPosition(document, position2);
		assert.strictEqual(symbol2, 'all');
	});
});
