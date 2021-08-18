#!/usr/bin/env bash

cd ./src/sprites && ./../../node_modules/.bin/svg-sprite -s --di --symbol-dest=./ --ss=icons.svg ./*.svg
