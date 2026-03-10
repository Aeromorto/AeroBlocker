// Envolve tudo numa função isolada para evitar conflitos
(function() {

  function pularAnuncio() {
    const botaoPular = document.querySelector(".ytp-skip-ad-button, .ytp-ad-skip-button");
    if (botaoPular) {
      botaoPular.click();
    }
    const videoAnuncio = document.querySelector(".ad-showing video");
    if (videoAnuncio) {
      videoAnuncio.currentTime = videoAnuncio.duration;
    }
  }

  function esconderBanners() {
    const seletores = [
      ".ytp-ad-overlay-container",
      ".ytp-ad-text-overlay",
      ".ytp-ad-timed-pie-countdown",
      "#masthead-ad",
      "#player-ads",
      "ytd-action-companion-ad-renderer",
      "ytd-banner-promo-renderer",
      "ytd-statement-banner-renderer",
      "ytd-in-feed-ad-layout-renderer",
      "ytd-promoted-sparkles-web-renderer",
      "ytd-display-ad-renderer",
    ];

    seletores.forEach((seletor) => {
      document.querySelectorAll(seletor).forEach((elemento) => {
        elemento.style.display = "none";
      });
    });
  }

  new MutationObserver(() => {
    pularAnuncio();
    esconderBanners();
  }).observe(document.body, { childList: true, subtree: true });

  pularAnuncio();
  esconderBanners();

})();