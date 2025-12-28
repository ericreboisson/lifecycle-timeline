# 🕒 Lifecycle Timeline

A premium, interactive Vanilla JS component for visualizing product lifecycles, including OSS support, Enterprise support, and EOL (End-Of-Life) dates.

![Lifecycle Timeline Screenshot](assets/screenshot.png)


## ✨ Features

- **Smart Filtering**: Real-time search to filter versions.
- **Dark Mode**: Native support with a persistent toggle.
- **Rich Legend**: Detailed explanation of support states.
- **Responsive Design**: Works on all screen sizes with horizontal scroll support.
- **Sticky Labels**: Version names stay visible while scrolling through time.
- **Interactive Tooltips**: Detailed date information on hover.
- **Live Indicator**: Pulsing badge showing the current date line.
- **Fully Typed**: Includes TypeScript definitions out of the box.

## 🚀 Installation

### Via NPM
```bash
npm install lifecycle-timeline
```

### Manual Installation
Download the files from the `dist` folder: `timeline.js` (ESM), `timeline.umd.cjs` (UMD), and `timeline.css`.

## 🛠 Usage

### Modern JavaScript (ESM)
```javascript
import Timeline from 'lifecycle-timeline';
import 'lifecycle-timeline/style.css';

const data = [
  {
    version: "6.0.x",
    ossStart: "2025-01-01",
    ossEnd: "2026-08-20",
    enterpriseEnd: "2027-02-15",
    releaseNotesUrl: "https://example.com/notes"
  }
];

new Timeline('timeline-root', data, { visibleCount: 3 });
```

### Browser (UMD)
```html
<link rel="stylesheet" href="https://unpkg.com/lifecycle-timeline/dist/timeline.css">
<div id="timeline-root"></div>

<script src="https://unpkg.com/lifecycle-timeline/dist/timeline.umd.cjs"></script>
<script>
  const data = [...];
  new Timeline('timeline-root', data);
</script>
```

## ⚙️ Configuration

### Constructor
`new Timeline(elementId, data, options)`

| Argument | Type | Description |
| :--- | :--- | :--- |
| `elementId` | `string` | The ID of the container element. |
| `data` | `Array` | List of version objects. |
| `options` | `Object` | Optional configuration. |

### Data Schema
Each version object in the `data` array should follow this structure:
- `version`: (String) Version name/number.
- `ossStart`: (String) Start date of OSS support (YYYY-MM-DD).
- `ossEnd`: (String) End date of OSS support (YYYY-MM-DD).
- `enterpriseEnd`: (String) End date of Enterprise support (YYYY-MM-DD).
- `releaseNotesUrl`: (String, Optional) Link to release notes.

### Options
- `visibleCount`: (Number, default: `3`) Number of versions to show before the "Show More" button appears.
- `locale`: (String, default: browser detect) Preferred language for the UI. Supported: `'en'`, `'fr'`.

## 🎨 Theming
The component uses CSS variables for easy customization. You can override them in your own CSS:

```css
:root {
  --accent-oss: #99e67d;     /* Color for OSS support bars */
  --accent-ent: #ffe88e;     /* Color for Enterprise support bars */
  --current-date: #086dc3;   /* Color for the current date line */
  --bg-primary: #ffffff;     /* Light mode background */
  --text-primary: #1e293b;   /* Light mode text */
}
```

## 🛠 Development

1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Build for production: `npm run build`

## 📄 License
MIT © Eric REBOISSON
