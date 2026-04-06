#!/bin/bash

# 修复图片引用路径脚本
# 将不存在的图片引用替换为实际存在的图片

cd /Users/ppt/Projects/basketball/miniprogram

echo "🔧 开始修复图片引用..."

# 1. 修复 default-team.png → basketball-placeholder.svg
echo "1. 修复 default-team.png → basketball-placeholder.svg"
find . -type f \( -name "*.wxml" -o -name "*.js" \) -exec sed -i '' 's|/images/default-team\.png|/images/basketball-placeholder.svg|g' {} +

# 2. 修复 default_avatar.png → default_avatar.svg
echo "2. 修复 default_avatar.png → default_avatar.svg"
find . -type f \( -name "*.wxml" -o -name "*.js" \) -exec sed -i '' 's|/images/default_avatar\.png|/images/default_avatar.svg|g' {} +

# 3. 修复 default-logo.png → logo.svg
echo "3. 修复 default-logo.png → logo.svg"
find . -type f \( -name "*.wxml" -o -name "*.js" \) -exec sed -i '' 's|/images/default-logo\.png|/images/logo.svg|g' {} +

# 4. 修复 empty-team.png → basketball-placeholder.svg
echo "4. 修复 empty-team.png → basketball-placeholder.svg"
find . -type f \( -name "*.wxml" -o -name "*.js" \) -exec sed -i '' 's|/images/empty-team\.png|/images/basketball-placeholder.svg|g' {} +

echo "✅ 修复完成！"

# 验证修复结果
echo ""
echo "📊 验证修复结果："
echo "剩余的错误引用："
grep -r "default-team\.png\|default_avatar\.png\|default-logo\.png\|empty-team\.png" . --include="*.wxml" --include="*.js" 2>/dev/null || echo "✅ 无错误引用"

echo ""
echo "正确的引用："
grep -r "basketball-placeholder\.svg\|default_avatar\.svg\|logo\.svg" . --include="*.wxml" --include="*.js" 2>/dev/null | wc -l | xargs echo "找到引用数量:"
