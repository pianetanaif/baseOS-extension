// content.js - Extracts page data

function getPageData() {
  const title = document.title || '';
  const url   = window.location.href;

  const metaDesc =
    document.querySelector('meta[name="description"]')?.content ||
    document.querySelector('meta[property="og:description"]')?.content ||
    document.querySelector('meta[name="twitter:description"]')?.content ||
    '';

  return { title, url, metaDesc };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_PAGE_DATA') {
    sendResponse(getPageData());
  }
});
