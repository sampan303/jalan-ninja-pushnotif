(function() {
  function safeLocalStorage(key, value) {
    try {
      if (value === undefined) {
        return window.localStorage.getItem(key);
      }
      window.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      return null;
    }
  }

  function getCurrentScript() {
    var currentScript = document.currentScript;
    if (!currentScript) {
      var scripts = document.getElementsByTagName('script');
      currentScript = scripts[scripts.length - 1];
    }
    return currentScript;
  }

  function parseApiOrigin(apiValue, fallback) {
    try {
      return new URL(apiValue, fallback).origin;
    } catch (err) {
      return fallback;
    }
  }

  function createWidgetContainer(apiOrigin, appId) {
    var container = document.createElement('div');
    var iframe = document.createElement('iframe');
    var iframeUrl = apiOrigin + '/widget-frame.html?appId=' + encodeURIComponent(appId) + '&api=' + encodeURIComponent(apiOrigin);

    container.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:2147483647;pointer-events:none;max-width:360px;width:100%;height:320px;';
    iframe.src = iframeUrl;
    iframe.style.cssText = 'width:100%;height:100%;border:0;border-radius:20px;overflow:hidden;pointer-events:auto;';
    iframe.title = 'Push notification widget';
    iframe.setAttribute('allow', 'notifications');

    container.appendChild(iframe);
    document.body.appendChild(container);

    window.addEventListener('message', function(event) {
      if (event.origin !== window.location.origin) return;
      if (!event.data || event.data.type !== 'push-widget-status') return;
      var status = event.data.status;
      if (status) {
        safeLocalStorage('push-widget-status-' + appId, status);
      }
      if (status === 'subscribed' || status === 'denied' || status === 'dismissed' || status === 'disabled') {
        container.remove();
      }
    });
  }

  function init() {
    if (!document || !document.body) return;
    var currentScript = getCurrentScript();
    var appId = (currentScript && currentScript.dataset.appId) ? currentScript.dataset.appId : 'default';
    var apiAttribute = currentScript && currentScript.dataset.api;
    var fallbackOrigin = window.location.origin;
    var apiOrigin = apiAttribute ? parseApiOrigin(apiAttribute, fallbackOrigin) : fallbackOrigin;
    var status = safeLocalStorage('push-widget-status-' + appId);

    if (status === 'subscribed' || status === 'denied' || status === 'dismissed' || status === 'disabled') {
      return;
    }

    createWidgetContainer(apiOrigin, appId);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
