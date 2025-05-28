# Makefile Navigator 使用指南

## 功能概览

这个VSCode扩展为Makefile提供了强大的符号导航功能，让你可以轻松地在复杂的Makefile项目中导航。

## 主要功能

### 1. 跳转到定义 (Go to Definition)
- **快捷键**: `F12` 或 `Ctrl/Cmd + 点击`
- **使用方法**: 将光标放在目标名称或变量名上，然后按F12或Ctrl+点击
- **支持的符号**:
  - 目标 (targets): `all:`, `clean:`, `install:`
  - 变量 (variables): `CC`, `CFLAGS`, `SRCDIR`
  - 变量引用: `$(CC)`, `$(CFLAGS)`

### 2. 查找所有引用 (Find All References)
- **快捷键**: `Shift + F12`
- **使用方法**: 将光标放在符号上，按Shift+F12
- **显示**: 在侧边栏中显示所有引用该符号的位置

### 3. 文档符号大纲 (Document Symbols)
- **快捷键**: `Ctrl/Cmd + Shift + O`
- **使用方法**: 打开符号面板，快速导航到文件中的任何目标或变量

## 支持的文件类型

- `Makefile` (标准Makefile)
- `makefile` (小写)
- `GNUmakefile` (GNU Make)
- `*.mk` (Make模块文件)
- `*.mak` (Make文件)

## 使用示例

### 示例Makefile

```makefile
# 变量定义
CC = gcc
CFLAGS = -Wall -Werror
SRCDIR = src
OBJDIR = obj

# 目标定义
all: $(OBJDIR)/main.o
	$(CC) $(CFLAGS) -o myapp $<

$(OBJDIR)/main.o: $(SRCDIR)/main.c
	@mkdir -p $(OBJDIR)
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	rm -rf $(OBJDIR) myapp

.PHONY: all clean
```

### 导航演示

1. **变量跳转**:
   - 点击 `$(CC)` → 跳转到 `CC = gcc`
   - 点击 `$(CFLAGS)` → 跳转到 `CFLAGS = -Wall -Werror`

2. **目标跳转**:
   - 在依赖项中点击 `$(OBJDIR)/main.o` → 跳转到目标定义

3. **查找引用**:
   - 在 `CC` 变量上按 Shift+F12 → 显示所有 `$(CC)` 的使用位置
   - 在 `clean` 目标上按 Shift+F12 → 显示在 `.PHONY` 中的引用

## 高级功能

### 支持的Make语法

- **变量赋值**: `VAR = value`, `VAR := value`, `VAR += value`, `VAR ?= value`
- **目标定义**: `target: dependencies`
- **模式规则**: `%.o: %.c`
- **伪目标**: `.PHONY: clean all`
- **变量引用**: `$(VAR)`, `${VAR}`

### 跨文件导航

扩展支持在包含多个Makefile的项目中进行跨文件导航，可以找到在不同Makefile中定义的目标和变量。

## 故障排除

### 常见问题

1. **符号不能跳转**:
   - 确保符号名称拼写正确
   - 检查是否在支持的文件类型中
   - 重新打开文件试试

2. **找不到引用**:
   - 确保项目中的所有Makefile都在工作空间中
   - 检查符号是否确实被引用

3. **性能问题**:
   - 对于大型项目，初次索引可能需要一些时间
   - 考虑排除不必要的目录

## 键盘快捷键总结

| 功能 | Windows/Linux | macOS |
|------|---------------|-------|
| 跳转到定义 | `F12` 或 `Ctrl + 点击` | `F12` 或 `Cmd + 点击` |
| 查找引用 | `Shift + F12` | `Shift + F12` |
| 文档符号 | `Ctrl + Shift + O` | `Cmd + Shift + O` |
| 返回 | `Alt + ←` | `Ctrl + -` |

## 反馈和支持

如果你发现任何问题或有功能建议，请在项目的GitHub仓库中提交issue。
