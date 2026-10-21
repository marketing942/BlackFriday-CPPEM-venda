# Operação Black CPPEM — Assinatura Até a Farda (página de VENDA)

Página de venda da Black Friday da CPPEM, com checkout direto em
`https://checkout.cppem.com.br/pay/assinatura-ate-a-farda`.
(A captura da live é a `../blackFridayCPPEM`.)

| | |
|---|---|
| **Oferta** | de ~~R$ 6.739,40~~ por **R$ 797 à vista** ou **12x de R$ 83,15** (total parcelado R$ 997,80) |
| **Janela** | botões ativos até 20/11, 23h59 (horário de Brasília) |
| **Prazos** | acesso à plataforma até a aprovação; mentoria ao vivo semanal por 1 ano |
| **Garantia** | 7 dias |

Estática, sem build: `index.html` + `styles.css` + `script.js` + `assets/`.

## O que editar no dia a dia

| O quê | Onde |
|---|---|
| Fim da oferta e link do checkout | `CONFIG` no topo do `script.js` |
| Revelar um bônus | `index.html`, seção `#bonus`: troque o texto de `.cofre__premio` e `.cofre__desc` |
| Marcar bônus como esgotado | no `<article class="cofre ...">`, troque `data-bonus="aberto"` por `data-bonus="esgotado"` (aparece o carimbo ESGOTADO e o cofre fica cinza) |
| Exit popup (textos) | bloco `#xp-modal` no fim do `index.html` |
| Exit popup (planilha, WhatsApp, tempo para armar) | `CONFIG` no topo do `exit-popup.js` (aba `OPERACAO_BLACK_DUVIDAS`) |
| Id da regra de clique da PixelX | `CONFIG.clickRuleId` (vai para o botão do hero; só pode existir uma vez) |

## Fases automáticas

- **aberta** (desde já): o relógio conta até o fim e os botões levam ao checkout com as UTMs da visita, mais `sck`, `external_id`, `fbp` e `fbc`;
- **encerrada**: "Oferta encerrada".

## Seções

1. **Hero**: o leão recortado da arte, logo antes do título original, com a borda direita estendida e esmaecida (`assets/hero-leao.webp`, versão de celular `hero-leao-560.webp`). O "ATÉ A FARDA" é texto vivo em metal. Em telas mais estreitas o leão desliza para a esquerda e o rosto nunca fica embaixo do texto.
2. **O caminho + a plataforma**: uma trilha lateral, da esquerda para a direita, guiada pela rolagem, em 6 etapas: Você → CPPEM → Missão diária → Evolução → Mentoria → Farda. Em cada trecho, a tela "Seu equipamento de trilha" mostra a ferramenta da plataforma que leva a pessoa até ali (dispositivos e IA, cronograma, rendimento, mentoria ao vivo). No celular, o print vai dentro do cartão da etapa. A farda fica **parada no horizonte, sempre à frente**. O viajante para em 86% da rota e o resto vira um fluxo de luz. Na última etapa, uma mira corre até a farda e trava ("Alvo travado").
3. **Faixa dourada** e **mentorias**: Everton, MDT, as tags TAF/psicotécnico/grupo e os extras digitais.
4. **Bônus** (1º, 10 e 30 primeiros), em texto, sem contador.
5. **Oferta**: ficha com os 13 itens entrando um a um, o preço, fogo atrás do botão e o selo de 7 dias.
6. **Prova social**: números, mural de fotos de farda e faixa de bilhetes com comentários.
7. **FAQ**, fecho e footer. No celular há uma barra fixa de compra depois do hero.
8. **Barra do topo**: vermelha e pulsando, com a tag "Oferta exclusiva" e o relógio até 20/11.
9. **Exit popup** (kit do comboPCPE2, tema ouro): "Ficou alguma dúvida?". Grava nome, e-mail e WhatsApp na planilha e abre o WhatsApp da equipe com a mensagem pronta. Dispara ao tirar o mouse da página (desktop) ou com inatividade ou um arremesso de volta ao topo (celular), uma vez por sessão e com 3 dias de silêncio depois de fechar. Não aparece para quem já clicou no checkout. Não conta como Lead de venda.

**Atmosfera**: a fumaça (`#fumaca`) é um canvas em meia resolução que reage à rolagem. As brasas (`#brasas`) usam o mesmo motor da captura. As duas ficam mais fortes perto dos bônus, da oferta e do fecho. Tudo desliga com `prefers-reduced-motion`.

## Medição

Eventos no dataLayer: `iniciar_checkout` (valor 797), `cta_travado`, `caminho_etapa`.
A conversão de compra é registrada pelo checkout. GTM: `sgtm.cppem.com.br` / `GTM-PJ379FLQ`.

## Deploy na Vercel

`"framework": null`. As imagens ficam em `assets/` e **nunca** em `public/`.
O `og:image` (`assets/og-ate-a-farda.jpg`, 1200×630) usa a arte original com o título. Para o preview do WhatsApp, troque pela URL absoluta depois do deploy.
