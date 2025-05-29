# Change Log

## [0.0.1] - 2025-05-28

### Added
- **Go to Definition**: Navigate to target and variable definitions within Makefiles
- **Find References**: Find all references to symbols across the entire workspace
- **Document Symbols**: Display all targets and variables in the outline view
- **Multi-file Support**: Symbol navigation across multiple Makefile files
- **Syntax Support**: Support for various Makefile syntax patterns
  - Target definitions: `target: dependencies`
  - Variable assignments: `VAR = value`, `VAR := value`, `VAR += value`, `VAR ?= value`
  - Variable references: `$(VAR)`, `${VAR}`
  - Phony targets: `.PHONY: target1 target2`
  - Pattern rules: `%.o: %.c`

### Supported Files
- `Makefile`
- `makefile`
- `GNUmakefile`
- `*.mk`
- `*.mak`

### Features
- Intelligent symbol recognition, distinguishing between targets, variables, and references
- Support for complex Makefile structures
- High-performance symbol parsing and indexing
- Cross-file symbol navigation