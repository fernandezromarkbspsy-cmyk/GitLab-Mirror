Windows Build & Test Validation Recovery
Purpose

Diagnose and resolve Windows-specific build and test validation failures, especially:

Vite spawn EPERM errors during config bundling

Backend test commands that hang or exceed the validation timeout

Validation commands that incorrectly report success after partial execution

When to use

Use this skill when:

npm run build fails with spawn EPERM

Vite fails while bundling/loading vite.config.*

A backend test command times out

A combined frontend/backend validation command does not finish

The validation environment reports incomplete or inconclusive results

Procedure
1. Establish a clean process state

Before retrying:

Stop existing Node/Vite development servers.

Terminate stale Node processes if necessary.

Run the validation from a fresh terminal.

Do not modify application code until the failure has been reproduced or sufficiently diagnosed.

2. Diagnose Vite spawn EPERM

If the build reports:

spawn EPERM


especially while bundling the Vite configuration:

Clear Vite's cache:

node_modules/.vite


Retry the normal build:

npm run build


If it fails again, run Vite with debug output:

npx vite build --debug


Inspect vite.config.* and its plugins for subprocess execution, including:

child_process.spawn
child_process.exec
child_process.execSync


and plugins that launch external processes.

Determine whether the failure originates from:

Vite itself

a Vite plugin

custom config code

an external executable

Windows permissions/security software

a stale Node process or locked file

Fix the underlying cause rather than suppressing the error.

3. Diagnose backend test timeouts

Never treat a timeout as a passing test result.

Run the backend test suite independently from the frontend build.

Use the project's existing test command first. If supported, enable verbose output and single-worker execution to locate hanging tests.

Examples:

npx vitest run --reporter=verbose --maxWorkers=1


or:

npx jest --runInBand --verbose


Do not blindly increase the timeout.

Determine whether the delay is caused by:

a hanging test

an unclosed server/database connection

a subprocess that does not terminate

an unavailable dependency

excessive test execution time

incorrect test configuration

Fix the underlying issue where possible.

4. Preserve project conventions

Before changing scripts, configuration, dependencies, or test infrastructure:

Inspect the existing package.json.

Inspect existing build/test scripts.

Reuse the project's current tooling.

Avoid replacing working infrastructure with a different test runner or build system.

Make the smallest change necessary to resolve the failure.

5. Re-run complete validation

After remediation, run:

The normal Vite production build.

The complete backend test suite.

The project's normal combined validation command, if one exists.

Do not declare success based on an individual partial check.

Failure handling

If the issue cannot be fully resolved:

Report the exact failing command.

Include the relevant error.

Identify what was successfully validated.

Identify what remains unvalidated.

Do not claim that tests passed when they timed out.

Do not claim that the build passed when Vite exited with an error.

Success criteria

The task is successfully validated only when:

The Vite production build exits successfully.

Backend tests complete rather than timing out.

Backend tests return a passing exit code.

The complete validation command, when applicable, finishes successfully.

No known spawn EPERM or hanging-test issue remains.

Final report format

Return a concise validation summary:

Build: PASS/FAIL
Backend tests: PASS/FAIL/TIMEOUT
Full validation: PASS/FAIL/INCOMPLETE

Commands:
- <command>
- <command>

Remaining issues:
- <issue or "None">