// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { MakefileDefinitionProvider } from './definitionProvider';
import { MakefileReferenceProvider } from './referenceProvider';
import { MakefileDocumentSymbolProvider } from './documentSymbolProvider';
import { MakefileHoverProvider } from './hoverProvider';
import { MakefileCompletionProvider } from './completionProvider';
import { MakefileDiagnosticProvider } from './diagnosticProvider';

// Makefile language selector
const MAKEFILE_SELECTOR: vscode.DocumentSelector = [
    { language: 'makefile', scheme: 'file' },
    { pattern: '**/Makefile', scheme: 'file' },
    { pattern: '**/makefile', scheme: 'file' },
    { pattern: '**/GNUmakefile', scheme: 'file' },
    { pattern: '**/*.mk', scheme: 'file' },
    { pattern: '**/*.mak', scheme: 'file' }
];

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Makefile Navigator extension is now active!');

	// Create diagnostic provider
	const diagnosticProvider = new MakefileDiagnosticProvider();

	// Register definition provider
	const definitionProvider = new MakefileDefinitionProvider();
	const definitionDisposable = vscode.languages.registerDefinitionProvider(
		MAKEFILE_SELECTOR,
		definitionProvider
	);

	// Register reference provider
	const referenceProvider = new MakefileReferenceProvider();
	const referenceDisposable = vscode.languages.registerReferenceProvider(
		MAKEFILE_SELECTOR,
		referenceProvider
	);

	// Register document symbol provider
	const documentSymbolProvider = new MakefileDocumentSymbolProvider();
	const documentSymbolDisposable = vscode.languages.registerDocumentSymbolProvider(
		MAKEFILE_SELECTOR,
		documentSymbolProvider
	);

	// Register hover provider
	const hoverProvider = new MakefileHoverProvider();
	const hoverDisposable = vscode.languages.registerHoverProvider(
		MAKEFILE_SELECTOR,
		hoverProvider
	);

	// Register completion provider
	const completionProvider = new MakefileCompletionProvider();
	const completionDisposable = vscode.languages.registerCompletionItemProvider(
		MAKEFILE_SELECTOR,
		completionProvider,
		'$', '(', ' ' // Trigger characters
	);

	// Add all disposables to context subscriptions
	context.subscriptions.push(
		definitionDisposable,
		referenceDisposable,
		documentSymbolDisposable,
		hoverDisposable,
		completionDisposable
	);

	// Set up diagnostic provider for open documents
	const updateDiagnostics = (document: vscode.TextDocument) => {
		if (document.languageId === 'makefile' || 
			document.fileName.endsWith('Makefile') || 
			document.fileName.endsWith('makefile') ||
			document.fileName.endsWith('.mk') ||
			document.fileName.endsWith('.mak')) {
			diagnosticProvider.provideDiagnostics(document);
		}
	};

	// Provide diagnostics for already open documents
	vscode.workspace.textDocuments.forEach(updateDiagnostics);

	// Listen for document changes
	context.subscriptions.push(
		vscode.workspace.onDidOpenTextDocument(updateDiagnostics),
		vscode.workspace.onDidChangeTextDocument(event => updateDiagnostics(event.document)),
		vscode.workspace.onDidCloseTextDocument(document => {
			// Clear diagnostics when document is closed
			if (document.languageId === 'makefile') {
				diagnosticProvider.clear();
			}
		}),
		diagnosticProvider
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
