# 🅰️ Angular Integration Guide

This guide explains how to integrate the `lifecycle-timeline` component into an Angular (v14+) application.

## 1. Installation

Install the package via NPM:

```bash
npm install lifecycle-timeline
```

## 2. Global Styling

Import the component's CSS in your global stylesheet (`styles.css` or `styles.scss`):

```css
/* styles.css */
@import 'lifecycle-timeline/dist/timeline.css';
```

> [!NOTE]
> If you encounter resolution issues, ensure your `package.json` supports the `exports` field or use the direct path: `@import 'node_modules/lifecycle-timeline/dist/timeline.css';`

## 3. Component Integration

Use the `Timeline` class in your Angular component. Since the component interacts with the DOM, it must be initialized in the `AfterViewInit` lifecycle hook.

### `example.component.html`
```html
<div class="container">
  <div id="timeline-container"></div>
</div>
```

### `example.component.ts`
```typescript
import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import Timeline from 'lifecycle-timeline';

@Component({
  selector: 'app-lifecycle-demo',
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.css']
})
export class LifecycleDemoComponent implements AfterViewInit, OnDestroy {
  private timeline: any;

  ngAfterViewInit() {
    const data = [
      {
        version: "1.0.0",
        ossStart: "2024-01-01",
        ossEnd: "2025-01-01",
        enterpriseEnd: "2026-01-01"
      }
    ];

    // Initialize the timeline
    this.timeline = new Timeline('timeline-container', data, {
      locale: 'fr',
      visibleCount: 5
    });
  }

  ngOnDestroy() {
    // Optional: Clean up tooltips or listeners if necessary
  }
}
```

## 4. Tips for Angular
- **Zone.js**: The component is vanilla JS and runs outside of Angular's Change Detection. This is generally good for performance.
- **Dynamic Updates**: If you need to update data from Angular, call `this.timeline.updateData(newData)`.
- **Theming**: You can toggle dark mode by adding `data-theme="dark"` to the `<html>` or a parent element, or by using the built-in toggle button.

---
MIT © Eric REBOISSON
