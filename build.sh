#!/bin/bash

# Replace this value with your add-on name
XPI=yourdict.xpi

# Replace this value to push to different release channels.
# Nightly = org.mozilla.fennec
# Aurora = org.mozilla.fennec_aurora
# Beta = org.mozilla.firefox_beta
# Release = org.mozilla.firefox
ANDROID_APP_ID=org.mozilla.firefox

# List add-on files here
zip -r $XPI bootstrap.js \
            install.rdf \
            chrome.manifest \
            chrome \
            asset \
            README.md \
    -x *.DS_Store*

# Push the add-on to your device to test
adb push "$XPI" /sdcard/"$XPI" && \
adb shell am start -a android.intent.action.VIEW \
                   -c android.intent.category.DEFAULT \
                   -d file:///mnt/sdcard/"$XPI" \
                   -n $ANDROID_APP_ID/.App && \
echo Pushed $XPI to $ANDROID_APP_ID
