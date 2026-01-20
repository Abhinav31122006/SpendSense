# SpendSense - Personal Expense Tracker

## Project Overview
SpendSense is an intelligent expense tracking web application built entirely with **Vanilla JavaScript**, HTML, and CSS. It helps users manage their monthly budget, track expenses across different categories, and visualize spending patterns through interactive donut charts.

## Problem Statement
Many people struggle to track their daily expenses and understand where their money goes each month. Without proper visualization and categorization, it's hard to identify spending patterns and stick to a budget. SpendSense solves this by providing:
- Real-time budget tracking with visual progress bars
- Category-wise expense analysis
- Monthly vs overall spending comparison
- Preset spending plans to help users allocate their budget wisely
- Persistent data storage so users don't lose their expense history

## Key Features Implemented

### 1. **Budget Management**
- Set a monthly budget and track spending in real-time
- Visual progress bar showing spent vs remaining amount
- Lock/unlock budget to prevent accidental changes

### 2. **Expense Tracking**
- Add expenses with amount, category, date, and optional notes
- Dynamically rendered expense list with category-specific colors
- Remove individual expenses (with lock protection)
- Automatic date defaulting to today

### 3. **Visual Analytics**
- Two interactive donut charts (This Month vs Overall)
- Canvas-based rendering with category-specific colors
- Real-time updates when expenses are added/removed
- Smooth animations and glowing effects

### 4. **Spending Plans**
- Three preset plans: Balanced, Saver, and Lifestyle
- Each plan allocates budget across categories with different ratios
- Visual warnings when category limits are approached or exceeded
- Beautiful alert system with progress bars and status badges

### 5. **Smart Warnings**
- Automatic detection when spending exceeds category limits
- Two-level alerts: "Near Limit" (80%) and "Limit Exceeded" (100%)
- Visual indicators with icons, progress bars, and percentage displays

### 6. **Theme Toggle**
- Switch between dark and light themes
- Netflix-inspired dark theme with dramatic shadows
- Clean light theme with better contrast
- Theme preference saved in localStorage

### 7. **Data Persistence**
- All data stored in browser's localStorage
- State automatically restored on page reload
- Includes budget, expenses, selected plan, lock states, and theme preference

## DOM Concepts & Techniques Used

### 1. **DOM Manipulation**
- `querySelector` and `querySelectorAll` for selecting elements
- `createElement` to dynamically create expense list items
- `innerHTML` for rendering complex structures (warnings, charts)
- `classList.toggle()`, `classList.add()`, `classList.remove()` for managing CSS classes
- `dataset` for storing custom data attributes (plan IDs, expense indices)

### 2. **Event Handling**
- Form submission with `preventDefault()` to avoid page reload
- Event delegation on expense list for efficient remove button handling
- Multiple event listeners for buttons, forms, and window events
- Real-time input validation before processing

### 3. **Dynamic Content Generation**
- `createExpenseItem()` function dynamically builds expense list items
- Template literals for clean HTML generation
- Conditional rendering (showing/hiding warnings, lock icons)
- Real-time DOM updates when state changes

### 4. **State Management**
- Centralized `appState` object holding all application data
- `saveState()` and localStorage for persistence
- State restoration on page load
- Multiple UI update functions triggered by state changes

### 5. **Canvas API for Charts**
- `getContext('2d')` for drawing operations
- `arc()` and `stroke()` for creating donut chart segments
- Shadow effects for visual depth
- Device pixel ratio handling for crisp rendering on high-DPI screens

### 6. **LocalStorage API**
- `localStorage.setItem()` to save application state
- `localStorage.getItem()` to restore state on page load
- JSON serialization/deserialization for complex data structures
- Error handling with try-catch for corrupted data

## How to Run the Project

1. **Clone or Download** the project folder
2. **Open `index.html`** in any modern browser (Chrome, Firefox, Safari, Edge)
3. **Start using the app**:
   - Set your monthly budget
   - Add expenses with categories
   - Watch the charts update in real-time
   - Select a spending plan to get category-wise warnings
   - Toggle between light/dark themes

**No server or build tools required!** Everything runs purely in the browser.

## Project Structure
```
 index.html    # Main HTML structure
 style.css     # All styling (Netflix-inspired theme)
 script.js     # Core JavaScript logic
 README.md     # This file
```

## Technical Highlights

### Pure Vanilla JavaScript
- No frameworks or libraries used (no React, Vue, jQuery, etc.)
- All DOM operations done manually
- Custom state management system
- Pure JavaScript for all interactions

### Responsive Design
- CSS Grid for layout
- Flexbox for component alignment
- Mobile-friendly with media queries
- Smooth transitions and hover effects

### Data-Driven UI
- All expenses rendered from state array
- Charts generated from calculated totals
- Warnings computed dynamically
- UI stays in sync with data

### User Experience
- Clear visual feedback for all actions
- Intuitive lock/unlock system
- Color-coded categories for easy identification
- Real-time validation and error prevention

## Known Limitations

1. **Browser-specific storage**: Data is stored only in the current browser. Clearing browser data will delete all expenses.

2. **No backend**: This is a client-side only application. Data cannot be synced across devices.

3. **Single user**: Designed for individual use, not multi-user scenarios.

4. **No export**: Currently no option to export expense data to CSV or PDF.

## Future Enhancements (Ideas)

- Add expense editing functionality
- Monthly/yearly comparison charts
- Custom spending plans
- Data export to CSV
- Recurring expense support
- Budget rollover feature
- Multiple budget periods

## Learning Outcomes

Through this project, I learned:
- How to structure a medium-sized JavaScript application
- Managing state without frameworks
- Dynamic DOM manipulation and event delegation
- Canvas API for custom visualizations
- LocalStorage for client-side persistence
- Creating responsive, interactive user interfaces
- Organizing CSS for maintainability

