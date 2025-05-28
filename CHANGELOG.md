# Change Log

## [0.0.1] - 2025-05-28

### Added
- **跳转到定义 (Go to Definition)**: 支持在Makefile中跳转到目标和变量的定义位置
- **查找引用 (Find References)**: 查找符号在整个工作空间中的所有引用
- **文档符号 (Document Symbols)**: 在大纲视图中显示所有目标和变量
- **多文件支持**: 跨多个Makefile文件进行符号导航
- **语法支持**: 支持多种Makefile语法模式
  - 目标定义: `target: dependencies`
  - 变量赋值: `VAR = value`, `VAR := value`, `VAR += value`, `VAR ?= value`
  - 变量引用: `$(VAR)`, `${VAR}`
  - 伪目标: `.PHONY: target1 target2`
  - 模式规则: `%.o: %.c`

### Supported Files
- `Makefile`
- `makefile`
- `GNUmakefile`
- `*.mk`
- `*.mak`

### Features
- 智能符号识别，区分目标、变量和引用
- 支持复杂的Makefile结构
- 高性能的符号解析和索引
- 跨文件符号导航