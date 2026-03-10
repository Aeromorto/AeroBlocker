// Quando o popup abrir, executa tudo isso:
document.addEventListener("DOMContentLoaded", () => {

  const botao = document.getElementById("botao");
  const nomeSite = document.getElementById("nomeSite");

  // Pega a aba que o usuário está usando agora
  chrome.tabs.query({ active: true, currentWindow: true }, (abas) => {
    const url = new URL(abas[0].url);
    const site = url.hostname; // Ex: "youtube.com"

    // Mostra o nome do site no popup
    nomeSite.textContent = site;

    // Pergunta pro background.js se o bloqueio está ativo nesse site
    chrome.runtime.sendMessage(
      { tipo: "verificarStatus", site: site },
      (resposta) => {
        atualizarBotao(resposta.ativo);
      }
    );

    // Quando o usuário clicar no botão
    botao.addEventListener("click", () => {
      chrome.runtime.sendMessage(
        { tipo: "alternarStatus", site: site },
        (resposta) => {
          atualizarBotao(resposta.ativo);
        }
      );
    });
  });

  // Atualiza a aparência do botão conforme o status
  function atualizarBotao(ativo) {
    if (ativo) {
      botao.textContent = "✅ Ativo neste site";
      botao.className = "ativo";
    } else {
      botao.textContent = "⛔ Desativado neste site";
      botao.className = "desativado";
    }
  }

});