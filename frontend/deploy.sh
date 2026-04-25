#!/bin/bash

# Get current version from package.json
VERSION=$(grep '"version"' package.json | sed 's/.*"\([^"]*\)".*/\1/')

# Extract major, minor, patch
IFS='.' read -r MAJOR MINOR PATCH <<< "$VERSION"

# Increment patch version
NEW_PATCH=$((PATCH + 1))
NEW_VERSION="$MAJOR.$MINOR.$NEW_PATCH"

echo "Incrementing version from $VERSION to $NEW_VERSION"

# Update package.json with new version
sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" package.json

# Build
echo "Running npm run build..."
npm run build

# Deploy
echo "Deploying to Firebase hosting..."
firebase deploy --only hosting

echo "Deploy completed successfully! Version updated to $NEW_VERSION"
