#!/bin/bash

echo "🚀 Setting up Document Paraphraser with Neon PostgreSQL"
echo ""

# Check if .env.local exists
if [ -f .env.local ]; then
  echo "✅ .env.local already exists"
else
  echo "⚠️  Creating .env.local from template..."
  cat > .env.local << 'EOF'
DATABASE_URL=postgresql://neondb_owner:npg_AqZ65bKglEmR@ep-spring-credit-ahcseq0d-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
OPENROUTER_API_KEY=your_openrouter_api_key_here
EOF
  echo "📝 Created .env.local - please update OPENROUTER_API_KEY"
  echo ""
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Push database schema
echo ""
echo "🗄️  Pushing database schema to Neon..."
npm run db:push

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Add your OPENROUTER_API_KEY to .env.local"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Visit http://localhost:3000"
echo ""
echo "Optional:"
echo "- Run 'npm run db:studio' to open database GUI"
echo "- See README-NEON.md for full documentation"
