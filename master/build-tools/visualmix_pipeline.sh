#!/bin/bash

echo "[Step 1/3]: Launching Core Integrity Verification Matrix..."
# Forces the script to check file statuses and verify everything matches the baseline inventory maps
python3 master/build-tools/visualmix_integrity.py --require-master change-master

# Capture the exit code of your script execution pass
INTEGRITY_STATUS=$?

if [ $INTEGRITY_STATUS -ne 0 ]; then
    echo "]CRITICAL FAULT\ Integrity check failed or un-authorized file mutations!"
    echo "🛑 Step 2 and all subsequent execution steps are stopped to protect the build environment."
    exit 1
fi

echo "✅ [Step 2/3]: Integrity verified successfully. Initializing project build-tools..."
# Drop your next local operations here (e.g., local server testing, file assembly, or local dist bundling)

echo "🚀 [Step 3/3]: Local verification sequence finalized."
