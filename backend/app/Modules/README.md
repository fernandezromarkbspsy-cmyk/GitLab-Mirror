# Business Modules

SOC5 Outbound follows a modular-monolith structure inspired by Fleetbase's extension architecture.

Initial modules:

- Outbound
- Dispatch
- Docking
- KPI

Each module registers through a Laravel service provider and owns a local `routes.php` entry point.

Rules:

1. Modules may depend on Core.
2. Core must not depend on modules.
3. Avoid direct module-to-module coupling.
4. Existing API contracts and business workflows must remain backward compatible during migration.
5. A module receives production behavior only after its existing implementation has been mapped and validated.
