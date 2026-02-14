#!/bin/bash

# 批量修复测试文件中的 simulate.load 路径问题

cd /Users/pptdexiaodiannao/projects/basketball

# 需要修复的文件列表
files=(
  "miniprogram/pages/match/create-match/__test__/create-match.test.js"
  "miniprogram/pages/team-detail/__test__/team-detail.test.js"
  "miniprogram/pages/create-team/__test__/create-team.test.js"
  "miniprogram/pages/profile/__test__/profile.test.js"
  "miniprogram/pages/teams/__test__/teams.test.js"
  "miniprogram/pages/member-manage/__test__/member-manage.test.js"
)

for file in "${files[@]}"; do
  echo "Fixing $file..."
  # 移除 rootPath 配置行
  sed -i '' '/rootPath: simulate\.utils\.getPath.*,//' "$file"
  sed -i '' '/rootPath: simulate\.utils\.getPath.*,//' "$file"
done

echo "Done! Fixed ${#files[@]} files."
