// Main application logic
// This file provides shared utilities for the PWA

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Auto-scroll to bottom helper
function scrollToBottom(element) {
  element.scrollTop = element.scrollHeight;
}

// Show notification (if supported)
function showNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body });
  }
}

// Request notification permission
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// Vibrate on mobile (if supported)
function vibrate(pattern = [100]) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

console.log('Claude Code Remote PWA loaded');
