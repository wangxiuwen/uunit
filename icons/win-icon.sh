#!/bin/bash

sips -z 16 16 uunit.png --out uunit.win/icon_16x16.png
sips -z 32 32 uunit.png --out uunit.win/icon_32x32.png
sips -z 64 64 uunit.png --out uunit.win/icon_64x64.png
sips -z 128 128 uunit.png --out uunit.win/icon_128x128.png
sips -z 256 256 uunit.png --out uunit.win/icon_256x256.png
sips -z 512 512 uunit.png --out uunit.win/icon_512x512.png

magick uunit.win/icon_*.png icon.ico

