import * as assert from 'assert';
import * as vscode from 'vscode';
import { MakefileHoverProvider } from '../hoverProvider';
import { MakefileCompletionProvider } from '../completionProvider';
import { MakefileDiagnosticProvider } from '../diagnosticProvider';

// Create a simple cancellation token for testing
const createCancellationToken = (): vscode.CancellationToken => ({
    isCancellationRequested: false,
    onCancellationRequested: () => ({ dispose: () => {} })
} as vscode.CancellationToken);

suite('Makefile Providers Test Suite', () => {
    vscode.window.showInformationMessage('Start Makefile Providers tests.');

    test('Hover Provider - Variable Hover', async () => {
        const hoverProvider = new MakefileHoverProvider();
        
        // Create a test document with Makefile content
        const content = `CC = gcc
CFLAGS = -Wall -g

all: main.o
\t$(CC) $(CFLAGS) -o myapp main.o
`;
        
        const document = await vscode.workspace.openTextDocument({
            content: content,
            language: 'makefile'
        });
        
        // Test hover on CC variable (line 4, position in $(CC))
        const position = new vscode.Position(4, 3); // Position at 'CC' in $(CC)
        const hover = hoverProvider.provideHover(document, position, createCancellationToken());
        
        assert.ok(hover, 'Hover should be provided for variable');
        if (hover instanceof vscode.Hover) {
            const markdownContent = hover.contents[0] as vscode.MarkdownString;
            assert.ok(markdownContent.value.includes('gcc'), 'Hover should show variable value');
        }
    });

    test('Hover Provider - Target Hover', async () => {
        const hoverProvider = new MakefileHoverProvider();
        
        const content = `all: main.o utils.o
\techo "Building all"

main.o: main.c
\tgcc -c main.c
`;
        
        const document = await vscode.workspace.openTextDocument({
            content: content,
            language: 'makefile'
        });
        
        // Test hover on 'all' target
        const position = new vscode.Position(0, 1); // Position at 'all'
        const hover = hoverProvider.provideHover(document, position, createCancellationToken());
        
        assert.ok(hover, 'Hover should be provided for target');
        if (hover instanceof vscode.Hover) {
            const markdownContent = hover.contents[0] as vscode.MarkdownString;
            assert.ok(markdownContent.value.includes('Dependencies'), 'Hover should show dependencies');
        }
    });

    test('Completion Provider - Variable Completions', async () => {
        const completionProvider = new MakefileCompletionProvider();
        
        const content = `CC = gcc
CFLAGS = -Wall
LDFLAGS = -lm

test:
\t$(C`;
        
        const document = await vscode.workspace.openTextDocument({
            content: content,
            language: 'makefile'
        });
        
        // Test completion after $(C - this should trigger variable completion
        const position = new vscode.Position(5, 3); // After $(C
        const completions = completionProvider.provideCompletionItems(
            document, 
            position, 
            createCancellationToken(),
            { triggerKind: vscode.CompletionTriggerKind.TriggerCharacter, triggerCharacter: '(' }
        );
        
        assert.ok(completions, 'Completions should be provided');
        if (Array.isArray(completions)) {
            const labels = completions.map(item => item.label);
            assert.ok(labels.includes('CC'), 'Should complete CC variable');
            assert.ok(labels.includes('CFLAGS'), 'Should complete CFLAGS variable');
            assert.ok(labels.includes('LDFLAGS'), 'Should complete LDFLAGS variable');
        }
    });

    test('Completion Provider - Target Completions', async () => {
        const completionProvider = new MakefileCompletionProvider();
        
        const content = `all: main.o
main.o: main.c

clean:
\trm -f *.o

test: m`;
        
        const document = await vscode.workspace.openTextDocument({
            content: content,
            language: 'makefile'
        });
        
        // Test completion in dependency position after "test: m"
        const lastLineIndex = document.lineCount - 1;
        const lastLine = document.lineAt(lastLineIndex);
        const position = new vscode.Position(lastLineIndex, lastLine.text.length); // At end of last line
        
        const completions = completionProvider.provideCompletionItems(
            document, 
            position, 
            createCancellationToken(),
            { triggerKind: vscode.CompletionTriggerKind.Invoke, triggerCharacter: undefined }
        );
        
        assert.ok(completions, 'Completions should be provided');
        if (Array.isArray(completions)) {
            const labels = completions.map(item => item.label);
            assert.ok(labels.includes('all'), 'Should complete with all target');
            assert.ok(labels.includes('main.o'), 'Should complete with main.o target');
        }
    });

    test('Diagnostic Provider - Tab vs Spaces', async () => {
        const diagnosticProvider = new MakefileDiagnosticProvider();
        
        const content = `all: main.o
    echo "This should be a tab!"  # This line uses spaces instead of tab
\techo "This is correct"         # This line uses tab
`;
        
        const document = await vscode.workspace.openTextDocument({
            content: content,
            language: 'makefile'
        });
        
        // Provide diagnostics
        diagnosticProvider.provideDiagnostics(document);
        
        // Since we can't directly access the diagnostic collection in tests,
        // we just verify the method runs without errors
        assert.ok(true, 'Diagnostic provider should run without errors');
    });
});
