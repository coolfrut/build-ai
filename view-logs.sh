#!/bin/bash
echo "📱 Viewing React Native + Firebase logs..."
echo "Press Ctrl+C to stop"
echo ""
adb logcat -s ReactNativeJS:* ReactNative:* Firebase:*
