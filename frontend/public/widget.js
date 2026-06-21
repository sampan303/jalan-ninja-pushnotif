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

  function getContainerStyle(position) {
    var base = 'position:fixed;z-index:2147483647;pointer-events:none;max-width:420px;width:calc(100% - 24px);height:320px;';
    switch (position) {
      case 'top-center':
        return base + 'top:20px;left:50%;transform:translateX(-50%);';
      case 'top-right':
        return base + 'top:20px;right:20px;';
      case 'top-left':
        return base + 'top:20px;left:20px;';
      case 'center':
        return base + 'top:50%;left:50%;transform:translate(-50%, -50%);';
      case 'bottom-center':
        return base + 'bottom:20px;left:50%;transform:translateX(-50%);';
      case 'bottom-left':
        return base + 'bottom:20px;left:20px;';
      case 'bottom-right':
      default:
        return base + 'bottom:20px;right:20px;';
    }
  }

  function createWidgetContainer(apiOrigin, appId, widgetPosition) {
    var container = document.createElement('div');
    var iframe = document.createElement('iframe');
    var iframeUrl = apiOrigin + '/widget-frame.html?appId=' + encodeURIComponent(appId) + '&api=' + encodeURIComponent(apiOrigin);

    container.style.cssText = getContainerStyle(widgetPosition);
    iframe.style.cssText = 'width:100%;height:100%;border:0;border-radius:20px;overflow:hidden;pointer-events:auto;';
    iframe.src = iframeUrl;
    iframe.title = 'Push notification widget';
    iframe.setAttribute('allow', 'notifications');

    container.appendChild(iframe);
    document.body.appendChild(container);

    window.addEventListener('message', function(event) {
      if (event.origin !== apiOrigin) return;
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

  async function init() {
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

    var position = 'bottom-right';
    try {
      var widgetInfoResp = await fetch(apiOrigin + '/api/widget-info?appId=' + encodeURIComponent(appId));
      if (widgetInfoResp.ok) {
        var widgetInfo = await widgetInfoResp.json();
        console.log('widget config', widgetInfo);
        var raw = widgetInfo.widgetPosition || widgetInfo.popupPosition || '';
        function normalizePosition(val) {
          if (!val) return null;
          val = String(val).trim().toLowerCase();
          var map = {
            'atas tengah': 'top-center',
            'atas kanan': 'top-right',
            'atas kiri': 'top-left',
            'tengah layar': 'center',
            'bawah kanan': 'bottom-right',
            'bawah kiri': 'bottom-left',
            'bawah tengah': 'bottom-center',
            'top center': 'top-center',
            'bottom center': 'bottom-center'
          };
          if (map[val]) return map[val];
          val = val.replace(/\s+/g, '-');
          if (['top-center','top-right','top-left','center','bottom-right','bottom-left','bottom-center'].indexOf(val) !== -1) return val;
          return null;
        }

        var normalized = normalizePosition(raw) || normalizePosition(widgetInfo.popupPosition) || normalizePosition(widgetInfo.widgetPosition);
        if (normalized) position = normalized;
        console.log('widget position', position);
      }
    } catch (err) {
      console.warn('Unable to load widget popup position:', err);
    }

    createWidgetContainer(apiOrigin, appId, position);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
