// Leave empty when the game and the API are on the same Vercel project.
window.VL_API = window.VL_API || '';
// Korapay checkout for the Top up app (pay.js), loaded once the game has started.
document.addEventListener('DOMContentLoaded', function () { var s = document.createElement('script'); s.src = '/pay.js?v=2'; document.body.appendChild(s); });
