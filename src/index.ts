#!/usr/bin/env node

import 'dotenv/config';
import chalk from 'chalk';
import { RSS_SOURCES } from './fetchers/sources.js';
import { fetchAllFeeds } from './fetchers/rss-fetcher.js';
import { filterLast24Hours, sortByDateDesc } from './filters/time-filter.js';
import { generateMarkdown, saveMarkdown } from './generators/markdown-generator.js';
import { summarizeArticles } from './summarizers/ai-summarizer.js';
import { getAIConfig } from './config/ai-config.js';

async function main() {
  try {
    console.log(chalk.bold.magenta('\n╔═══════════════════════════════════════╗'));
    console.log(chalk.bold.magenta('║   AI News Digest Generator v1.0      ║'));
    console.log(chalk.bold.magenta('╚═══════════════════════════════════════╝\n'));

    const allArticles = await fetchAllFeeds(RSS_SOURCES);

    console.log(chalk.blue('🔍 Filtering articles from last 24 hours...'));
    const recentArticles = filterLast24Hours(allArticles);
    console.log(chalk.green(`✓ Found ${recentArticles.length} articles from last 24 hours\n`));

    console.log(chalk.blue('📋 Sorting articles by date...'));
    let sortedArticles = sortByDateDesc(recentArticles);
    console.log(chalk.green('✓ Articles sorted\n'));

    const aiConfig = getAIConfig();
    if (aiConfig) {
      console.log(chalk.cyan(`🤖 AI summarization enabled (${aiConfig.provider.toUpperCase()})\n`));
      sortedArticles = await summarizeArticles(sortedArticles, aiConfig);
    } else {
      console.log(chalk.yellow('⚠ No AI API key found. Skipping summarization.'));
      console.log(chalk.yellow('  Set ANTHROPIC_API_KEY or OPENAI_API_KEY environment variable to enable.\n'));
    }

    console.log(chalk.blue('📝 Generating Markdown report...'));
    const markdown = generateMarkdown(sortedArticles, new Date());

    const filepath = await saveMarkdown(markdown);
    console.log(chalk.green(`✓ Report saved to: ${filepath}\n`));

    console.log(chalk.bold.green('🎉 Done! Your AI news digest is ready.\n'));

    process.exit(0);
  } catch (error) {
    console.error(chalk.bold.red('\n❌ Error:'), error);
    process.exit(1);
  }
}

main();
