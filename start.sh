#!/bin/bash
# 获取当前脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 在新终端中运行Python应用
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    gnome-terminal -- bash -c "cd $SCRIPT_DIR && python app.py; exec bash"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    osascript -e "tell application \"Terminal\" to do script \"cd $SCRIPT_DIR && python app.py\""
else
    echo "Unsupported OS: $OSTYPE"
fi