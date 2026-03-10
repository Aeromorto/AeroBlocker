// Envolve tudo numa função isolada para evitar conflitos
(function() {

  window.open = function() {
    return null;
  };

  let urlAtual = window.location.href;
  new MutationObserver(() => {
    if (window.location.href !== urlAtual) {
      if (document.visibilityState === "hidden") {
        window.location.href = urlAtual;
      }
      urlAtual = window.location.href;
    }
  }).observe(document, { subtree: true, childList: true });

  new MutationObserver((mutacoes) => {
    mutacoes.forEach((mutacao) => {
      mutacao.addedNodes.forEach((node) => {
        if (node.nodeType === 1 && node.tagName === "IFRAME") {
          const src = node.src || "";
          const dominiosBloqueados = [
            "doubleclick", "googlesyndication", "adservice",
            "taboola", "outbrain", "amazon-adsystem", "hotjar"
          ];
          if (dominiosBloqueados.some(d => src.includes(d))) {
            node.remove();
          }
        }
      });
    });
  }).observe(document.documentElement, { childList: true, subtree: true });

})();