#!/bin/bash

sips -z 16 16 uunit.png --out uunit.iconset/icon_16x16.png
sips -z 32 32 uunit.png --out uunit.iconset/icon_32x32.png
sips -z 64 64 uunit.png --out uunit.iconset/icon_64x64.png
sips -z 128 128 uunit.png --out uunit.iconset/icon_128x128.png
sips -z 256 256 uunit.png --out uunit.iconset/icon_256x256.png
sips -z 512 512 uunit.png --out uunit.iconset/icon_512x512.png
sips -z 1024 1024 uunit.png --out uunit.iconset/icon_1024x1024.png

iconutil -c icns uunit.iconset