# SOC5-OUTBOUND: DESIGN TOKENS SPECIFICATION

This document defines the complete set of reusable design tokens required for the SOC5-Outbound UI modernization. All frontend implementation must utilize these tokens via CSS custom properties.

---

## 1. Color Palette
| Token | CSS Property | Value | Description |
| :--- | :--- | :--- | :--- |
| **Background** | `--color-bg-base` | `#F4F4F6` | Main page background |
| **Surface** | `--color-surface` | `#FFFFFF` | Card/Widget background |
| **Primary** | `--color-primary` | `#6C5CE7` | Accent/Action color |
| **Text Primary** | `--color-text-primary` | `#2D3436` | Primary headings/text |
| **Text Secondary**| `--color-text-secondary` | `#636E72` | Secondary labels/text |

## 2. Semantic Colors
| Token | CSS Property | Value | Description |
| :--- | :--- | :--- | :--- |
| **Success** | `--color-success` | `#00B894` | Success states |
| **Warning** | `--color-warning` | `#FDCB6E` | Warning states |
| **Danger** | `--color-danger` | `#FF7675` | Error/Danger states |

## 3. Typography
- **Font Family:** `--font-family-base`: 'Inter', sans-serif
- **Scale:**
    - `--fs-xs`: 12px, `--fs-sm`: 14px, `--fs-md`: 16px, `--fs-lg`: 20px, `--fs-xl`: 24px
- **Font Weights:** `--fw-normal`: 400, `--fw-medium`: 500, `--fw-bold`: 700

## 4. Spacing Scale (8px Grid)
- `--spacing-1`: 4px, `--spacing-2`: 8px, `--spacing-3`: 12px, `--spacing-4`: 16px, `--spacing-6`: 24px, `--spacing-8`: 32px

## 5. Border Radius
- `--radius-sm`: 4px, `--radius-md`: 6px, `--radius-lg`: 8px

## 6. Elevation & Shadows
- `--shadow-sm`: `0 1px 2px rgba(0,0,0,0.05)`
- `--shadow-md`: `0 2px 4px rgba(0,0,0,0.05)`

## 7. Responsive Breakpoints
- `--bp-tablet`: 768px
- `--bp-desktop`: 1024px

## 8. Motion
- `--transition-fast`: `150ms ease-in-out`
- `--transition-slow`: `300ms ease-in-out`

---
## Implementation Recommendations
1.  **Usage:** Implement exclusively via CSS custom properties.
2.  **Naming:** Use the suggested variable names provided above.
3.  **Scalability:** Do not hardcode values; update the token file if a new value is required.
