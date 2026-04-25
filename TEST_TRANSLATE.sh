#!/bin/bash

# Test script for translate mode French default fix
# Tests the three fixes applied to ensure translation defaults to French

API_BASE="http://localhost:3001"
JWT_TOKEN="${1:-your-jwt-token-here}"

echo "=========================================="
echo "Testing Translate Mode - French Default"
echo "=========================================="
echo ""

# Test 1: Translate WITHOUT targetLang (should translate to French)
echo "Test 1: Translate WITHOUT targetLang parameter"
echo "Expected: Text translated to French"
echo "---"
curl -X POST "$API_BASE/api/tasks" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Hello, this is a test message about artificial intelligence and blockchain technology.",
    "taskType": "translate"
  }' | jq '.'
echo ""
echo ""

# Test 2: Translate WITH explicit targetLang (should translate to Spanish)
echo "Test 2: Translate WITH explicit targetLang=Spanish"
echo "Expected: Text translated to Spanish (should NOT be French)"
echo "---"
curl -X POST "$API_BASE/api/tasks" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Hello world, how are you today?",
    "taskType": "translate",
    "targetLang": "Spanish"
  }' | jq '.'
echo ""
echo ""

# Test 3: Translate WITH explicit targetLang=German
echo "Test 3: Translate WITH explicit targetLang=German"
echo "Expected: Text translated to German"
echo "---"
curl -X POST "$API_BASE/api/tasks" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Artificial intelligence is transforming the world of technology.",
    "taskType": "translate",
    "targetLang": "German"
  }' | jq '.'
echo ""
echo ""

# Test 4: Verify other task types still work (summarize)
echo "Test 4: Verify other task types not affected (summarize)"
echo "Expected: Should summarize without error, no targetLang required"
echo "---"
curl -X POST "$API_BASE/api/tasks" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Artificial intelligence is a rapidly evolving field that encompasses machine learning, deep learning, natural language processing, and computer vision. AI has applications in healthcare, finance, autonomous vehicles, and many other industries. The development of AI requires large datasets, computational power, and sophisticated algorithms.",
    "taskType": "summarize"
  }' | jq '.'
echo ""
echo ""

echo "=========================================="
echo "Tests Complete!"
echo "=========================================="
echo ""
echo "Verification Checklist:"
echo "✓ Test 1: Should show French translation in 'result' field"
echo "✓ Test 2: Should show Spanish translation, NOT French"
echo "✓ Test 3: Should show German translation"
echo "✓ Test 4: Should show summary in English (no targetLang needed for summarize)"
echo ""
