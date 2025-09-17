// Bellow is an example of analytics script using Matomo
// Replace the content of this file with the code from your analytics software

// var _paq = window._paq = window._paq || [];
// /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
// _paq.push(['trackPageView']);
// _paq.push(['enableLinkTracking']);
// (function() {
//   var u="https://matomo.mydomain.fr/";
//   _paq.push(['setTrackerUrl', u+'matomo.php']);
//   _paq.push(['setSiteId', '1']);
//   var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
//   g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
// })();

// Custom event "newPageViewed" is fired by Tracim on page change once the new page title has been set.
// document.addEventListener('newPageViewed', function (e) {
//   // Custom code goes here
//   _paq.push(['setCustomUrl', window.location.href]);
//   // The page title includes the number of unread mention. The event data e.detail.newTitle is the page title
//   // without the unread mention count to make the title stable.
//   _paq.push(['setDocumentTitle', e.detail.newTitle]);
//   _paq.push(['trackPageView']);
// })
