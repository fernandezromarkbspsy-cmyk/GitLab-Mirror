# UI/UX Wireframes

## Visual direction

Dense but readable operations UI. Inter font, navy `#172554`, orange `#F97316`,
cool-gray surfaces, 8 px spacing grid, 10 px radii, and WCAG AA contrast. Status is
communicated by text plus color.

## Login

```text
+-------------------------------------------------------+
| SOC 5 Outbound                    Internal operations |
|                                                       |
|  Sign in                                             |
|  [ Email or Ops ID                           ]        |
|  [ Password                                  ]        |
|  [ Sign in ]                                          |
+-------------------------------------------------------+
```

## Application shell

```text
+-------------+-----------------------------------------+
| SOC 5       | Page title                  User / role |
| Dashboard   +-----------------------------------------+
| Requests    | KPI cards / filters                     |
| Role pages  |-----------------------------------------|
|             | Responsive request table                |
|             | row -> detail drawer + event timeline   |
+-------------+-----------------------------------------+
```

Desktop uses a fixed sidebar; mobile uses a drawer and card rows. Action buttons
appear only when both role and current state permit them. Destructive actions require
confirmation. Forms retain entered values after validation errors.

