#!/bin/bash

# Script to apply SQL migrations to Supabase
# Can be used either with Supabase CLI or for manual application

MIGRATIONS_DIR="$(dirname "$0")/migrations"
INSTRUCTIONS_FILE=$(mktemp)

echo "Supabase Migration Helper"
echo "========================="
echo ""

# Check if migrations directory exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "Error: Migrations directory not found at $MIGRATIONS_DIR"
  exit 1
fi

# Count how many SQL files we have
SQL_FILES=$(find "$MIGRATIONS_DIR" -name "*.sql" | sort)
FILE_COUNT=$(echo "$SQL_FILES" | wc -l)

if [ $FILE_COUNT -eq 0 ]; then
  echo "No SQL migration files found in $MIGRATIONS_DIR"
  exit 1
fi

# Try to detect if Supabase CLI is available
if command -v supabase &> /dev/null; then
  echo "Supabase CLI detected. You can use it to apply migrations directly."
  echo "Command: supabase db reset"
  echo "Or: supabase migration up"
  echo ""
fi

# Generate a file with all the SQL statements
echo "Creating instruction file for manual application..."
echo "SQL MIGRATION INSTRUCTIONS" > "$INSTRUCTIONS_FILE"
echo "------------------------" >> "$INSTRUCTIONS_FILE"
echo "Copy and execute the following SQL blocks in Supabase Studio SQL Editor:" >> "$INSTRUCTIONS_FILE"
echo "" >> "$INSTRUCTIONS_FILE"

# Add each SQL file to the instructions
for SQL_FILE in $SQL_FILES; do
  FILENAME=$(basename "$SQL_FILE")
  echo "=== $FILENAME ===" >> "$INSTRUCTIONS_FILE"
  echo "" >> "$INSTRUCTIONS_FILE"
  cat "$SQL_FILE" >> "$INSTRUCTIONS_FILE"
  echo "" >> "$INSTRUCTIONS_FILE"
  echo "----- End of $FILENAME -----" >> "$INSTRUCTIONS_FILE"
  echo "" >> "$INSTRUCTIONS_FILE"
done

echo "Found $FILE_COUNT SQL files to apply:"
echo "$SQL_FILES" | xargs -n1 basename

# Ask what to do next
echo ""
echo "Options:"
echo "1. View instructions for manual application"
echo "2. Copy all SQL to clipboard for manual application"
echo "3. Exit"
read -p "Select option (1-3): " OPTION

case $OPTION in
  1)
    echo "Opening instructions file..."
    cat "$INSTRUCTIONS_FILE"
    ;;
  2)
    if command -v pbcopy &> /dev/null; then
      cat "$INSTRUCTIONS_FILE" | pbcopy
      echo "SQL copied to clipboard. Paste it in Supabase Studio SQL Editor."
    else
      echo "pbcopy not available. Here's the SQL:"
      cat "$INSTRUCTIONS_FILE"
    fi
    ;;
  *)
    echo "Exiting."
    ;;
esac

# Clean up
rm "$INSTRUCTIONS_FILE"
echo "Done." 