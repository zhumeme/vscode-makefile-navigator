# Makefile Navigator

A Visual Studio Code extension that provides comprehensive language support for Makefiles, including navigation, auto-completion, hover information, and diagnostics.

## Features

- **Go to Definition**: Click on targets or variable names in Makefiles to jump to their definition location
- **Find References**: Find all references of a target or variable throughout the entire workspace
- **Document Symbol Navigation**: Display all targets and variables in Makefiles in VS Code's outline view
- **IntelliSense**: Provide auto-completion suggestions for variables, targets, and functions
- **Hover Information**: Show detailed information such as variable values and target dependencies when hovering
- **Diagnostic Checks**: Detect common Makefile errors, such as mixed tabs and spaces, undefined variables, etc.

## Supported Symbol Types

- **Targets**: Such as `all:`, `clean:`, `install:`, etc.
- **Variables**: Such as `CC = gcc`, `CFLAGS = -Wall`, etc.
- **Variable References**: Such as `$(CC)`, `$(CFLAGS)`, etc.
- **Pattern Rules**: Such as `%.o: %.c`, etc.

## Usage

1. Install the extension
2. Open a project containing Makefiles
3. In Makefiles:
   - Hold `Ctrl/Cmd` and click on symbol names to jump to their definitions
   - Right-click on symbols and select "Go to Definition" or "Find All References"
   - Use `Ctrl/Cmd + Shift + O` to view document symbol outline
   - Type `$(` to automatically trigger variable name completion
   - Get automatic suggestions for available targets when typing in target dependency positions
   - Hover over variables or targets to view detailed information

## Supported Files

- `Makefile`
- `makefile` 
- `GNUmakefile`
- `*.mk`
- `*.mak`

## Example

In the following Makefile:

```makefile
CC = gcc
CFLAGS = -Wall

all: main.o
	$(CC) $(CFLAGS) -o myapp main.o

main.o: main.c
	$(CC) $(CFLAGS) -c main.c

clean:
	rm -f *.o myapp
```

- Clicking `$(CC)` will jump to the `CC = gcc` definition
- Finding references on `CC` will show all usage locations of `$(CC)`
- Clicking `main.o` will jump to the `main.o:` target definition

## Development

To develop and test this extension locally:

1. Clone the repository
2. Run `npm install`
3. Press `F5` to launch a new VS Code window for testing

## License

MIT

**Enjoy!**
