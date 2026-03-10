// Limite do Edge para regras dinâmicas
const LIMITE_REGRAS = 30000;

// Fonte das listas de bloqueio (Steven Black's hosts - mais de 150.000 domínios)
const URL_LISTA = "https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts";

// Converte o formato "hosts" para o formato de regras do Edge
function converterHosts(texto) {
  const regras = [];
  let id = 2000;
  const linhas = texto.split("\n");

  for (const linha of linhas) {
    // Ignora comentários e linhas vazias
    if (linha.startsWith("#") || linha.trim() === "") continue;

    // Formato: "0.0.0.0 dominio.com"
    const partes = linha.trim().split(/\s+/);
    if (partes.length < 2) continue;
    if (partes[0] !== "0.0.0.0") continue;

    const dominio = partes[1];

    // Ignora entradas inválidas
    if (!dominio || dominio === "0.0.0.0" || dominio === "localhost") continue;

    regras.push({
      id: id++,
      priority: 1,
      action: { type: "block" },
      condition: {
        urlFilter: `||${dominio}^`,
        resourceTypes: ["script", "image", "xmlhttprequest", "sub_frame", "stylesheet"]
      }
    });

    // Respeita o limite do Edge
    if (id >= 2000 + LIMITE_REGRAS) break;
  }

  return regras;
}

// Busca e aplica as regras da lista externa
async function atualizarRegras() {
  try {
    console.log("AeroBlocker: Buscando lista de bloqueio atualizada...");

    const resposta = await fetch(URL_LISTA);
    const texto = await resposta.text();
    const novasRegras = converterHosts(texto);

    // Remove regras dinâmicas antigas
    const regrasAtuais = await chrome.declarativeNetRequest.getDynamicRules();
    const idsAntigos = regrasAtuais.map(r => r.id);

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: idsAntigos,
      addRules: novasRegras
    });

    // Salva a data da última atualização
    await chrome.storage.local.set({ 
      ultimaAtualizacao: new Date().toISOString(),
      totalRegras: novasRegras.length
    });

    console.log(`AeroBlocker: ${novasRegras.length} regras aplicadas com sucesso!`);

  } catch (erro) {
    console.log("AeroBlocker: Falha ao buscar lista externa, usando regras locais.", erro);
  }
}

// Ao instalar ou atualizar a extensão, busca as regras
chrome.runtime.onInstalled.addListener(() => {
  atualizarRegras();
});

// Escuta mensagens do popup
chrome.runtime.onMessage.addListener((mensagem, remetente, responder) => {

  // Verifica status do site atual
  if (mensagem.tipo === "verificarStatus") {
    chrome.storage.local.get("sitesDesativados", (resultado) => {
      const sites = resultado.sitesDesativados || {};
      responder({ ativo: !sites[mensagem.site] });
    });
    return true;
  }

  // Alterna status do site atual
  if (mensagem.tipo === "alternarStatus") {
    const site = mensagem.site;

    chrome.storage.local.get("sitesDesativados", (resultado) => {
      const sites = resultado.sitesDesativados || {};
      const idRegra = 1000 + Object.keys(sites).length;

      if (sites[site]) {
        delete sites[site];
        chrome.declarativeNetRequest.updateSessionRules({
          removeRuleIds: [idRegra]
        });
      } else {
        sites[site] = true;
        chrome.declarativeNetRequest.updateSessionRules({
          removeRuleIds: [idRegra],
          addRules: [{
            id: idRegra,
            priority: 10,
            action: { type: "allow" },
            condition: { requestDomains: [site] }
          }]
        });
      }

      chrome.storage.local.set({ sitesDesativados: sites });
      responder({ ativo: !sites[site] });
    });
    return true;
  }

  // Retorna total de regras ativas
  if (mensagem.tipo === "totalRegras") {
    chrome.storage.local.get(["totalRegras", "ultimaAtualizacao"], (resultado) => {
      responder(resultado);
    });
    return true;
  }
});