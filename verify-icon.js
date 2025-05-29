#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 验证 VS Code 扩展图标配置...\n');

// 检查 package.json 中的图标配置
const packagePath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

console.log('📋 Package.json 配置:');
console.log(`   扩展名称: ${packageJson.displayName}`);
console.log(`   图标路径: ${packageJson.icon || '❌ 未配置'}`);
console.log();

// 检查图标文件是否存在
const iconPath = path.join(__dirname, packageJson.icon || '');
const iconExists = fs.existsSync(iconPath);

console.log('📁 图标文件检查:');
console.log(`   主图标 (${packageJson.icon}): ${iconExists ? '✅ 存在' : '❌ 不存在'}`);

// 检查图标文件大小
if (iconExists) {
    const stats = fs.statSync(iconPath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`   文件大小: ${sizeKB} KB ${sizeKB > 50 ? '⚠️ (建议小于50KB)' : '✅'}`);
}

// 检查其他尺寸的图标
console.log('\n📐 其他尺寸图标:');
const sizes = ['16', '32', '64', '128'];
sizes.forEach(size => {
    const sizeIconPath = path.join(__dirname, 'images', `icon-${size}.png`);
    const exists = fs.existsSync(sizeIconPath);
    console.log(`   ${size}x${size}px: ${exists ? '✅' : '❌'}`);
});

// 检查 SVG 源文件
const svgPath = path.join(__dirname, 'images', 'icon.svg');
const svgExists = fs.existsSync(svgPath);
console.log(`   SVG 源文件: ${svgExists ? '✅' : '❌'}`);

console.log('\n🔧 构建建议:');
console.log('   1. 运行 "npm run package" 打包扩展');
console.log('   2. 检查生成的 .vsix 文件中是否包含图标');
console.log('   3. 在 VS Code 中安装测试版本验证图标显示');

console.log('\n✨ 图标配置检查完成！');
