#!/usr/bin/env bash

# Fix electron path.txt (npm install writes it with trailing newline)
if [ -f node_modules/electron/path.txt ]; then
  printf "electron" > node_modules/electron/path.txt
fi

npm run electron:dev
