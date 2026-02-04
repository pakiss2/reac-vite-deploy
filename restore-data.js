// Data Restoration Script
// Run this in your browser console (F12) while on http://localhost:5174

console.log('🔄 Starting data restoration...');

// Clear all existing data
localStorage.removeItem('waterwise_clients');
localStorage.removeItem('waterwise_bills');
localStorage.removeItem('waterwise_billing_settings');
localStorage.removeItem('waterwise_penalty_settings');

console.log('✅ Cleared old data from localStorage');
console.log('🔄 Refreshing page to regenerate data...');

// Reload the page to regenerate data from mockData.js
window.location.reload();
