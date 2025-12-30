# 📊 Lifecycle Timeline - Markdown Integration

This file demonstrates how you can embed the **Lifecycle Timeline** component directly into a Markdown file using HTML blocks. 

## 🕒 Live Component Example

<link rel="stylesheet" href="https://unpkg.com/lifecycle-timeline@1.2.2/dist/timeline.css">

<div id="sample-timeline" style="margin: 20px 0; padding: 20px; background: #fff; border-radius: 12px; border: 1px solid #e5e7eb;">
    <!-- The component will be injected here -->
</div>

<script src="https://unpkg.com/lifecycle-timeline@1.2.2/dist/timeline.umd.cjs"></script>
<script>
  window.addEventListener('load', () => {
    const data = [
      {
        version: "7.0.x (Alpha)",
        ossStart: "2025-10-01",
        ossEnd: "2026-12-31",
        enterpriseEnd: "2028-06-30"
      },
      {
        version: "6.5.x (Stable)",
        ossStart: "2024-05-15",
        ossEnd: "2025-08-20",
        enterpriseEnd: "2027-04-10"
      },
      {
        version: "5.4.x (LTS)",
        ossStart: "2023-01-10",
        ossEnd: "2024-11-30",
        enterpriseEnd: "2025-12-31"
      }
    ];

    if (window.Timeline) {
      new Timeline('sample-timeline', data, { 
        visibleCount: 2, 
        locale: 'fr' 
      });
    }
  });
</script>

---

## 🛠 How to use in your Markdown?

To achieve the result above, copy and paste this snippet into your `.md` file:

```html
<!-- Load Styles -->
<link rel="stylesheet" href="https://unpkg.com/lifecycle-timeline/dist/timeline.css">

<!-- Placeholder -->
<div id="timeline-root"></div>

<!-- Load Library -->
<script src="https://unpkg.com/lifecycle-timeline/dist/timeline.umd.cjs"></script>

<!-- Initialize -->
<script>
  new Timeline('timeline-root', [
    {
      version: "1.0.0",
      ossStart: "2024-01-01",
      ossEnd: "2025-01-01"
    }
  ]);
</script>
```

## 🚀 Use Cases
- **Internal Documentation**: Enhance your team's project docs.
- **Project Roadmaps**: Display lifecycle dates in your `README` (if hosted on a site like Docusaurus or GitBook).
- **Personal Dashboards**: Use it in tools like Obsidian (with HTML support enabled).
