# Axide Database - Style Guide Implementation

This document describes the styling system implemented for the Axide Accessibility Database, based on the Axide Brand Style Guide.

## Visual DNA

> **Black / Silence / Pastel Neon / Diagonals / Speed**

The UI follows these golden rules:

- **Predominantly Black** (60–85% of surfaces)
- **One accent color at a time** (Cyan `#2DE2E6` as primary)
- **Generous whitespace** ("The void" is a key design element)
- **Diagonals** inspired by the logo's movement

---

## Color Palette

### Neutrals

| Name | Hex | Usage |
|------|-----|-------|
| Primary Black | `#0B0B10` | Main background, premium deep black |
| Surface Black | `#12121A` | Cards, modals, elevated surfaces |
| Primary Text | `#F5F6FA` | Main text, headings |
| Secondary Text | `#B9BBC7` | Descriptions, labels, muted text |
| Subtle Outline | `#242433` | Borders, dividers, inactive states |

### Accent Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Strong Pastel Cyan** | `#2DE2E6` | Primary accent, buttons, links, highlights |
| Magenta | `#E61E8C` | Service category badge |
| Electric Lavender | `#A78BFA` | Game category badge |
| Mint | `#5EF0B6` | Place category badge, success states |
| Peach | `#FFB3A7` | Software category badge |

### Category Color Mapping (WCAG AA Compliant)

These colors have been updated to meet WCAG AA contrast requirements (4.5:1 minimum for normal text):

```css
game: 'bg-[#C4B5FD]/20 text-[#C4B5FD] border-[#C4B5FD]/40'
hardware: 'bg-[#5EEAD4]/20 text-[#5EEAD4] border-[#5EEAD4]/40'
place: 'bg-[#86EFAC]/20 text-[#86EFAC] border-[#86EFAC]/40'
software: 'bg-[#FED7AA]/20 text-[#FED7AA] border-[#FED7AA]/40'
service: 'bg-[#F9A8D4]/20 text-[#F9A8D4] border-[#F9A8D4]/40'
```

| Category | Old Color | New Color | Contrast Ratio |
|----------|-----------|-----------|----------------|
| Game | #A78BFA | #C4B5FD | ~7:1 |
| Hardware | #2DE2E6 | #5EEAD4 | ~8:1 |
| Place | #5EF0B6 | #86EFAC | ~9:1 |
| Software | #FFB3A7 | #FED7AA | ~10:1 |
| Service | #E61E8C | #F9A8D4 | ~8:1 |

---

## Typography

### Font Families

| Purpose | Font | Weights |
|---------|------|---------|
| Headings | Space Grotesk | 300–700 |
| Body Text | Inter | 300–700 |
| Code/Tech | JetBrains Mono | 400, 500 |

### Implementation

```css
h1, h2, h3, h4, h5, h6 {
    font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif;
}

body {
    font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
}

code, pre, kbd {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
}
```

---

## Custom Utilities

### Glow Effects

```css
.glow-cyan {
    box-shadow: 0 0 20px rgba(45, 226, 230, 0.3), 0 0 40px rgba(45, 226, 230, 0.1);
}

.glow-cyan-sm {
    box-shadow: 0 0 10px rgba(45, 226, 230, 0.2);
}

.glow-cyan-lg {
    box-shadow: 0 0 30px rgba(45, 226, 230, 0.4), 0 0 60px rgba(45, 226, 230, 0.2);
}

.text-glow-cyan {
    text-shadow: 0 0 20px rgba(45, 226, 230, 0.5), 0 0 40px rgba(45, 226, 230, 0.3);
}
```

### Diagonal Accent

```css
.diagonal-accent {
    background: linear-gradient(20deg, transparent 49%, #2DE2E6 49%, #2DE2E6 51%, transparent 51%);
}
```

---

## Animated Counter

The `TotalEntriesCounter` component features a large, animated number display with scroll effects.

### Animations

```css
@keyframes digit-slide-up {
    0% { transform: translateY(100%); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
}

@keyframes digit-slide-down {
    0% { transform: translateY(-100%); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
}

@keyframes digit-exit-up {
    0% { transform: translateY(0); opacity: 1; }
    100% { transform: translateY(-100%); opacity: 0; }
}

@keyframes digit-exit-down {
    0% { transform: translateY(0); opacity: 1; }
    100% { transform: translateY(100%); opacity: 0; }
}
```

### Usage Classes

- `.animate-digit-up` - New digit enters from bottom
- `.animate-digit-down` - New digit enters from top
- `.animate-digit-exit-up` - Old digit exits to top
- `.animate-digit-exit-down` - Old digit exits to bottom

### Counter Styling

- Font size: `text-8xl` (mobile) → `text-9xl` (tablet) → `text-[12rem]` (desktop)
- Color: Cyan `#2DE2E6` with text glow
- Container: Rounded card with border glow on hover
- Live indicator: Pulsing green dot

---

## Component Styling Patterns

### Buttons

**Primary Button:**

```jsx
className="bg-[#2DE2E6] text-[#0B0B10] hover:bg-[#2DE2E6]/90 hover:shadow-[0_0_30px_rgba(45,226,230,0.4)]"
```

**Outline Button:**

```jsx
className="border-[#242433] text-[#F5F6FA] hover:border-[#2DE2E6]/50 hover:bg-[#2DE2E6]/5"
```

### Cards

```jsx
className="border-[#242433] bg-[#12121A] hover:border-[#2DE2E6]/40 hover:shadow-[0_0_30px_rgba(45,226,230,0.1)]"
```

### Badges

**Category Badge:**

```jsx
className="border bg-[color]/15 text-[color] border-[color]/30"
```

**Status Badge (Complete):**

```jsx
className="bg-[#5EF0B6]/10 text-[#5EF0B6] border-[#5EF0B6]/30"
```

**Status Badge (Incomplete):**

```jsx
className="bg-[#FFB3A7]/10 text-[#FFB3A7] border-[#FFB3A7]/30"
```

### Form Inputs

```jsx
className="border-[#242433] bg-[#12121A] text-[#F5F6FA] placeholder:text-[#B9BBC7]/50 focus:border-[#2DE2E6]/50 focus:ring-[#2DE2E6]/20"
```

### Rating Stars

- Active: `text-[#2DE2E6]`
- Inactive: `text-[#242433]`

### Accessibility Rating Bars

```jsx
<div className="h-full rounded-full bg-gradient-to-r from-[#2DE2E6] to-[#5EF0B6]" />
```

---

## Layout Structure

### Header

- Fixed position with glassmorphism effect
- Background: `bg-[#0B0B10]/80 backdrop-blur-md`
- Border: `border-b border-[#242433]/50`

### Main Content

- Generous padding: `px-4 py-12 sm:px-8`
- Max width: `max-w-7xl` for content areas
- Decorative diagonal lines for visual interest

### Footer

- Subtle separator: gradient line
- Muted text with cyan accent

---

## Files Modified

1. **`src/styles/globals.css`** - Theme variables, fonts, animations, utilities
2. **`src/app/layout.tsx`** - Root layout with fonts and header
3. **`src/app/page.tsx`** - Home page styling
4. **`src/components/TotalEntriesCounter.tsx`** - Animated counter component
5. **`src/components/EntriesList.tsx`** - Entry cards and list styling
6. **`src/components/AddEntryModal.tsx`** - Modal and form styling
7. **`src/components/EntryDetailView.tsx`** - Detail page styling
8. **`src/components/Comments.tsx`** - Comments section styling
9. **`src/components/AccessibilitySearch.tsx`** - Search component styling
10. **`src/app/entry/[id]/not-found.tsx`** - 404 page styling

---

## CSS Variables (Dark Theme)

```css
:root {
    --background: #0B0B10;
    --foreground: #F5F6FA;
    --card: #12121A;
    --card-foreground: #F5F6FA;
    --popover: #12121A;
    --popover-foreground: #F5F6FA;
    --primary: #2DE2E6;
    --primary-foreground: #0B0B10;
    --secondary: #242433;
    --secondary-foreground: #F5F6FA;
    --muted: #12121A;
    --muted-foreground: #B9BBC7;
    --accent: #2DE2E6;
    --accent-foreground: #0B0B10;
    --destructive: #ff4757;
    --border: #242433;
    --input: #242433;
    --ring: #2DE2E6;
    --radius: 0.75rem;
}
```
