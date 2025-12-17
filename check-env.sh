#!/bin/bash

echo "🔍 Checking required environment variables for Vercel deployment..."
echo ""

REQUIRED_VARS=(
  "MONGODB_URI"
  "JWT_SECRET"
  "OPENAI_API_KEY"
  "FIREBASE_API_KEY"
  "FIREBASE_AUTH_DOMAIN"
  "FIREBASE_PROJECT_ID"
  "FIREBASE_STORAGE_BUCKET"
  "FIREBASE_MESSAGING_SENDER_ID"
  "FIREBASE_APP_ID"
  "STRIPE_SECRET_KEY"
  "STRIPE_PRICE_PRO"
  "STRIPE_WEBHOOK_SECRET"
  "APP_URL"
  "ADMIN_EMAIL"
  "ADMIN_PASSWORD"
)

MISSING=()
FOUND=()

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    MISSING+=("$var")
  else
    FOUND+=("$var")
  fi
done

echo "✅ Found (${#FOUND[@]}):"
for var in "${FOUND[@]}"; do
  echo "  - $var"
done

echo ""

if [ ${#MISSING[@]} -gt 0 ]; then
  echo "❌ Missing (${#MISSING[@]}):"
  for var in "${MISSING[@]}"; do
    echo "  - $var"
  done
  echo ""
  echo "⚠️  You need to set these environment variables in Vercel before deploying."
  echo ""
  echo "Run this for each missing variable:"
  echo "  vercel env add VARIABLE_NAME production"
  exit 1
else
  echo "🎉 All required environment variables are set!"
  echo ""
  echo "You're ready to deploy to Vercel!"
  echo ""
  echo "Deploy with:"
  echo "  vercel --prod"
fi

