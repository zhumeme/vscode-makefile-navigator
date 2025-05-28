# Makefile Navigator

A Visual Studio Code extension that provides comprehensive language support for Makefiles, including navigation, auto-completion, hover information, and diagnostics.

## Features

- **跳转到定义 (Go to Definition)**: 在Makefile中点击目标(target)或变量名时，可以跳转到其定义位置
- **查找引用 (Find References)**: 查找某个目标或变量在整个工作空间中的所有引用
- **文档符号导航**: 在VS Code的大纲视图中显示Makefile中的所有目标和变量
- **智能提示 (IntelliSense)**: 提供变量、目标和函数的自动完成建议
- **悬停信息 (Hover)**: 鼠标悬停时显示变量值、目标依赖关系等详细信息
- **诊断检查**: 检测常见的Makefile错误，如制表符与空格混用、未定义变量等

## 支持的符号类型

- **目标 (Targets)**: 如 `all:`, `clean:`, `install:` 等
- **变量 (Variables)**: 如 `CC = gcc`, `CFLAGS = -Wall` 等
- **变量引用**: 如 `$(CC)`, `$(CFLAGS)` 等
- **模式规则**: 如 `%.o: %.c` 等

## 使用方法

1. 安装扩展
2. 打开包含Makefile的项目
3. 在Makefile中：
   - 按住 `Ctrl/Cmd` 并点击符号名称可跳转到定义
   - 右键点击符号选择"Go to Definition"或"Find All References"
   - 使用 `Ctrl/Cmd + Shift + O` 查看文档符号大纲
   - 输入 `$(` 自动触发变量名完成
   - 在目标依赖位置输入时自动提示可用目标
   - 悬停在变量或目标上查看详细信息

## 支持的文件

- `Makefile`
- `makefile` 
- `GNUmakefile`
- `*.mk`
- `*.mak`

## 示例

在以下Makefile中：

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

- 点击 `$(CC)` 会跳转到 `CC = gcc` 的定义
- 在 `CC` 上查找引用会显示所有 `$(CC)` 的使用位置
- 点击 `main.o` 会跳转到 `main.o:` 目标定义

## 开发

要在本地开发和测试此扩展：

1. 克隆仓库
2. 运行 `npm install`
3. 按 `F5` 启动新的VS Code窗口进行测试

## License

MIT

**Enjoy!**
