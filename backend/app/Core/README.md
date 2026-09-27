# Core Platform

The Core layer contains application-wide capabilities that business modules may depend on.

Planned ownership:

- Auth
- IAM
- Events
- Notifications
- Realtime
- Integrations
- Support

Rules:

1. Core must not depend on business modules.
2. Core contains reusable platform capabilities, not SOC5 business workflows.
3. Existing production behavior remains in the legacy feature structure until migrated step by step.
