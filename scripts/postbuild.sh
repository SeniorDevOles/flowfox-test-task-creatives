#!/bin/bash
# Copy Prisma query engine files to deployment directory
set -e

# Find the generated Prisma client directory
PRISMA_GENERATED="src/generated/prisma"

# Ensure Prisma Client is generated
npx prisma generate

# Copy query engine files if they exist
if [ -d "$PRISMA_GENERATED" ]; then
  echo "Prisma Client generated at $PRISMA_GENERATED"
  # Vercel will handle the files automatically
fi

