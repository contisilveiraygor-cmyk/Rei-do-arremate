# Rei do Arremate

Vitrine estatica de oportunidades com consulta de disponibilidade antes da compra.

Esta primeira versao nao tem checkout. O cliente escolhe um produto e envia uma
mensagem de consulta pelo WhatsApp.

## Estrutura publicada

- `site/index.html`: pagina principal
- `site/styles.css`: estilos
- `site/app.js`: filtros, detalhes e consulta
- `site/data/produtos.json`: catalogo publico
- `site/assets/products/`: imagens publicas dos produtos

## GitHub Pages

O workflow em `.github/workflows/pages.yml` publica a pasta `site/` no GitHub Pages
quando houver push na branch `main`.
