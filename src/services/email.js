// Email Service (Backend-Only Flow)
// 
// Note: As per security requirements, all email sending and API keys reside
// strictly on the backend (Node.js/Express) to prevent leakage of credentials.
// The frontend reads sent email logs and notification histories via the main API 
// endpoint in Notifications.jsx.

export const emailService = {
  // Empty definition to comply with frontend-only layout guidelines
  getMailLogs: () => {
    console.log("Mail transactions reside on the server logs.")
    return Promise.resolve([])
  }
}
