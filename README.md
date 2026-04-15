# AI News Digest

🤖 A CLI tool that aggregates AI news from multiple RSS sources, uses AI to summarize each article, and generates a daily Markdown report.

## Features

- 📡 Fetches articles from multiple AI news sources:
  - TechCrunch AI
  - The Verge AI
  - Hacker News (AI-related)
- ⏰ Filters articles from the last 24 hours
- 🤖 **AI-powered article summarization** (Claude or GPT)
- 📋 Sorts articles by publication date (newest first)
- 📝 Generates clean Markdown reports with summaries
- 🔄 Concurrent fetching with retry logic
- 🎨 Colorful CLI output
- ⚡ Fast execution with TypeScript + tsx

## Installation

```bash
# Install dependencies
npm install

# Configure AI API (required for summarization)
cp .env.example .env
# Edit .env and add your API key
```

## Configuration

Create a `.env` file with your AI API credentials:

```bash
# Option 1: Anthropic Claude (Recommended)
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ANTHROPIC_MODEL=claude-3-5-haiku-20241022

# Option 2: OpenAI
# OPENAI_API_KEY=your_openai_api_key_here
# OPENAI_MODEL=gpt-4o-mini
```

**Note**: If no API key is provided, the tool will still work but skip AI summarization.

## Usage

```bash
# Run the digest generator
npm start
```

The tool will:
1. Fetch RSS feeds from all configured sources
2. Filter articles from the last 24 hours
3. Sort articles by date (newest first)
4. **Summarize each article using AI** (if API key is configured)
5. Generate a Markdown report in the `output/` directory

The generated report will be named: `ai-news-YYYY-MM-DD.md`

## Project Structure

```
ai-news-digest/
├── src/
│   ├── index.ts                    # CLI entry point
│   ├── types.ts                    # TypeScript interfaces
│   ├── config/
│   │   └── ai-config.ts           # AI API configuration
│   ├── fetchers/
│   │   ├── rss-fetcher.ts         # RSS fetching with retry logic
│   │   ├── sources.ts             # RSS source configuration
│   │   └── content-fetcher.ts     # Article content extraction
│   ├── parsers/
│   │   └── feed-parser.ts         # RSS XML parsing
│   ├── filters/
│   │   └── time-filter.ts         # Time-based filtering
│   ├── summarizers/
│   │   └── ai-summarizer.ts       # AI-powered summarization
│   └── generators/
│       └── markdown-generator.ts   # Markdown report generation
├── output/                         # Generated reports
├── .env.example                    # Environment variable template
├── package.json
├── tsconfig.json
└── README.md
```

## Dependencies

- `rss-parser` - RSS/Atom feed parsing
- `axios` - HTTP requests
- `date-fns` - Date manipulation
- `chalk` - Terminal styling
- `tsx` - TypeScript execution
- `@anthropic-ai/sdk` - Anthropic Claude API
- `openai` - OpenAI GPT API
- `cheerio` - HTML parsing for content extraction

## Development

```bash
# Watch mode (auto-reload on changes)
npm run dev
```

## Adding New RSS Sources

Edit `src/fetchers/sources.ts`:

```typescript
export const RSS_SOURCES: RSSSource[] = [
  {
    name: 'Your Source Name',
    url: 'https://example.com/rss/feed.xml',
  },
  // ... more sources
];
```

## Output Example

The generated Markdown report includes:
- Report date and statistics
- AI-generated summary for each article (2-3 sentences in Chinese)
- List of articles with title, summary, link, source, and timestamp
- Statistics by source

## License

MIT
