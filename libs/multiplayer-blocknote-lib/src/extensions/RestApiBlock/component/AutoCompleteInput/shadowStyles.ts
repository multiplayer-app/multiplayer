export const shadowStyles = `
.cm-theme-light,
.cm-theme-dark {
  width: 100%;
}
.cm-theme-light .cm-editor.cm-focused,
.cm-theme-dark .cm-editor.cm-focused {
  z-index: 20;
  outline: none;
}

.cm-theme-light .cm-theme-light,
.cm-theme-light .cm-editor,
.cm-theme-dark .cm-theme-dark,
.cm-theme-dark .cm-editor {
  flex: 1;
  width: 100%;
  height: 100%;
  color: inherit;
  background-color: transparent;
}

.cm-theme-light .cm-editor .cm-content,
.cm-theme-dark .cm-editor .cm-content {
  padding: 8px;
}

.cm-theme-light .cm-editor .cm-scroller,
.cm-theme-dark .cm-editor .cm-scroller {
  font-family: Inter, sans-serif;
  scrollbar-width: none;
  overscroll-behavior-y: auto;
}


.cm-theme-light .cm-editor .cm-tooltip,
.cm-theme-dark .cm-editor .cm-tooltip {
  background-color: #f8fafc;
  color: #374151;
  border-radius: 0.375rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 0;
  z-index: 20;
  border: none;
}

.cm-theme-dark .cm-editor .cm-tooltip {
  background-color: #020617;
  color: #e5e7eb;
}


.cm-theme-light .cm-editor .cm-tooltip-arrow,
.cm-theme-dark .cm-editor .cm-tooltip-arrow {
  color: #374151;
}

.cm-theme-light .cm-editor .cm-tooltip-arrow:after,
.cm-theme-light .cm-editor .cm-tooltip-arrow:before,
.cm-theme-dark .cm-editor .cm-tooltip-arrow:after,
.cm-theme-dark .cm-editor .cm-tooltip-arrow:before {
  border-top-color: currentColor;
}


.cm-theme-light .cm-editor .cm-tooltip.cm-tooltip-autocomplete > ul,
.cm-theme-dark .cm-editor .cm-tooltip.cm-tooltip-autocomplete > ul {
  font-family: monospace;
}

.cm-theme-light .cm-editor .cm-tooltip.cm-tooltip-autocomplete > ul > *,
.cm-theme-dark .cm-editor .cm-tooltip.cm-tooltip-autocomplete > ul > * {
  line-height: 1.5rem;
}


.cm-theme-light .cm-editor .cm-tooltip-autocomplete ul li[aria-selected="true"],
.cm-theme-dark .cm-editor .cm-tooltip-autocomplete ul li[aria-selected="true"] {
  background-color: #e5e7eb;
  color: #374151;
}

.cm-theme-dark .cm-editor .cm-tooltip-autocomplete ul li[aria-selected="true"] {
  background-color: #1f2937;
  color: #e5e7eb;
}

.cm-theme-light .cm-editor .cm-tooltip-autocomplete ul li[aria-selected="true"] .cm-completionLabel,
.cm-theme-dark .cm-editor .cm-tooltip-autocomplete ul li[aria-selected="true"] .cm-completionLabel {
  color: #374151;
}

.cm-theme-dark .cm-editor .cm-tooltip-autocomplete ul li[aria-selected="true"] .cm-completionLabel {
  color: #e5e7eb;
}


.env-variable {
  border-radius: 4px;
  padding: 2px 4px;
  margin: 0 2px;
  outline: none;
  color: white;
  caret-color: white;
  font-weight: 500;
}


.env-variable-base {
  background-color: #f59e0b;
}
.env-variable-unknown {
  background-color: #ef4444;
}
.env-variable-unknownValue {
  background-color: #ef4444;
}
.env-variable-block {
  background-color: #10b981;
}
.env-variable-request {
  background-color: #06b6d4;
}
.env-variable-global {
  background-color: #6366f1;
}
.env-variable-predefined {
  background-color: #f59e0b;
}


.env-tooltip {
  padding: 6px 8px;
  border-radius: 4px;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  background-color: #ffffff;
  white-space: pre-wrap;
  font-size: 14px;
  line-height: 1.5;
  max-width: 300px;
}

.cm-theme-dark .env-tooltip {
  background-color: #020617;
  color: #e5e7eb;
  box-shadow: 0px 4px 10px rgba(15, 23, 42, 0.9);
}

.env-tooltip-value {
  font-weight: 500;
  color: #1f2937;
}

.cm-theme-dark .env-tooltip-value {
  color: #e5e7eb;
}

.env-tooltip-description {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.cm-theme-dark .env-tooltip-description {
  color: #9ca3af;
}
.cm-editor {
  background-color: transparent !important;
}
`
