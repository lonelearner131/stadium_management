# Contributing to Stadium Companion AI

First off, thank you for considering contributing to Stadium Companion AI. It's people like you that make Stadium Companion AI such a great tool for the FIFA World Cup 2026 fan experience.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct:
- Use welcoming and inclusive language.
- Be respectful of differing viewpoints and experiences.
- Gracefully accept constructive criticism.
- Focus on what is best for the community.

## Development Setup

1. **Clone the repository:**
   \`\`\`bash
   git clone <repository-url>
   cd stadium_management
   \`\`\`

2. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up environment variables:**
   Copy `.env.example` to `.env.local` and add your `GEMINI_API_KEY`.
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

4. **Run the development server:**
   \`\`\`bash
   npm run dev
   \`\`\`

## Branching Strategy

- \`main\`: The primary branch. Always production-ready.
- \`feature/*\`: For new features (e.g., \`feature/add-new-gate\`).
- \`bugfix/*\`: For fixing issues (e.g., \`bugfix/fix-chat-streaming\`).
- \`docs/*\`: For documentation updates.

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- \`feat:\` A new feature.
- \`fix:\` A bug fix.
- \`docs:\` Documentation only changes.
- \`style:\` Changes that do not affect the meaning of the code (white-space, formatting, etc.).
- \`refactor:\` A code change that neither fixes a bug nor adds a feature.
- \`perf:\` A code change that improves performance.
- \`test:\` Adding missing tests or correcting existing tests.
- \`chore:\` Changes to the build process or auxiliary tools.

**Example Commit Message:**
\`\`\`
feat: add translation support for Japanese

Added Japanese phrases to the internationalization dictionary for quick translation.
\`\`\`

## Pull Request Process

1. **Ensure Tests Pass:** Run \`npm run test\` to verify all unit and integration tests pass.
2. **Ensure Linting Passes:** Run \`npm run lint\` (we enforce zero warnings, including complexity and depth limits).
3. **Build Locally:** Run \`npm run build\` to ensure the production build completes without errors.
4. **Submit PR:** Open a Pull Request targeting the \`main\` branch. Provide a clear description of the changes and link to any relevant issues.

## Testing Guidelines

- Write unit tests for all new utility functions and hooks (\`__tests__/\`).
- Use React Testing Library for component tests.
- Ensure 95%+ test coverage for the AI provider layer (\`lib/ai/\`).
- All tests must be deterministic; do not mock the network for internal logic unless testing API edge cases.

## Style Guide

- Follow the established ESLint rules.
- Maximum 50 lines per function.
- Maximum cyclomatic complexity of 10.
- Maximum nesting depth of 3 blocks.
- Use TypeScript for all new files; strictly type inputs and returns (no \`any\`).

Thank you for contributing!
