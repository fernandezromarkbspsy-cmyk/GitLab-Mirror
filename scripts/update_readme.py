# scripts/update_readme.py

import json
import os
import subprocess
import urllib.request

API_KEY = os.environ["OPENAI_API_KEY"]
MODEL = "gpt-5.6-luna"

def run_git(command):
    return subprocess.check_output(
        command,
        shell=True,
        text=True,
        encoding="utf-8"
    ).strip()

readme = open("README.md", "r", encoding="utf-8").read()

git_log = run_git(
    'git log -10 --pretty=format:"%h | %s | %an | %ad" --date=short'
)

git_diff = run_git(
    "git diff HEAD~1 HEAD --stat"
)

# scripts/update_readme.py

# scripts/update_readme.py

# scripts/update_readme.py

prompt = f"""
Generate a comprehensive, modern, production-grade README.md for the SOC5 Outbound web application.

The README must be:
- Clean and highly scannable.
- Engineering-focused.
- Based ONLY on verified repository information provided below.
- Automatically updated to reflect the latest implementation.
- Free of unnecessary or repetitive wording.
- Free of invented features, commands, services, URLs, variables, architecture, or configuration.
- Suitable for a production GitLab repository.

Use:
- Bullet points.
- Markdown tables where useful.
- Code blocks for commands.
- Clear section headings.
- Concise technical descriptions.

Required structure:

1. Header & Hero
   - Application name.
   - One-sentence description.
   - CI/CD badge placeholders.
   - Live/demo URL if verified; otherwise omit it.
   - Product screenshot placeholder if no verified screenshot exists.

2. Tech Stack
   - Frontend.
   - Backend.
   - Database.
   - Authentication.
   - Third-party services.
   - Tooling.

3. Getting Started
   - Prerequisites.
   - Clone command.
   - Dependency installation.
   - Environment configuration.
   - Required environment variables in a markdown table.
   - Development commands.
   - Use only commands verified from the repository.

4. Testing
   - Unit/integration test commands.
   - E2E commands if configured.
   - Clearly omit unsupported test commands.

5. Docker / Deployment
   - Docker commands if Docker configuration exists.
   - Deployment information based only on repository configuration.

6. API & Contributing
   - API documentation if available.
   - Contribution guidelines if available.
   - License information if verified.

7. Current Project Status
   - Important implemented features/migrations.
   - Current architecture state.
   - Only include verified information.

IMPORTANT:
- Inspect the latest commits and change summary.
- Update existing README content instead of blindly replacing useful documentation.
- Remove outdated information.
- Keep the README comprehensive but concise.
- Do not add filler, marketing language, or generic explanations.
- Do not expose secrets or secret values.
- Never invent environment variables; derive them from repository configuration.
- Never invent URLs.
- Never claim a feature exists unless supported by the repository.
- Keep the final README technically accurate.
- Return ONLY the raw Markdown content.
- Do not wrap the entire response in Markdown code fences.

CURRENT README:
{readme}

RECENT COMMITS:
{git_log}

LATEST CHANGE SUMMARY:
{git_diff}
"""