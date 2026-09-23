# Website da Óptica Excelente E.I. — Fase 1

Frontend multipágina completo, desenvolvido apenas com HTML5, CSS3 e JavaScript Vanilla. Nesta fase, os dados são guardados no `localStorage` do navegador e a sessão administrativa no `sessionStorage`.

## Como executar

O site utiliza módulos JavaScript e deve ser aberto através de um servidor local.

1. Abra um terminal na pasta `frontend`.
2. Execute:

   ```powershell
   python -m http.server 4173
   ```

3. Abra `http://localhost:4173/` no navegador.

Também pode utilizar qualquer servidor estático equivalente, como a extensão Live Server.

## Acesso administrativo temporário

- Página: `http://localhost:4173/pages/admin/login.html`
- Email: `admin@opticaexcelente.co.mz`
- Palavra-passe: `VisaoExcelente2026!`

Esta autenticação serve apenas para demonstração do frontend. A palavra-passe é comparada no navegador através de SHA-256 e a sessão é temporária; isto **não substitui** autenticação segura no backend.

## Dados reais configurados

- Nome: Óptica Excelente E.I.
- Slogan: Visão Excelente
- Localização: Xipamanine, Maputo, Moçambique
- Coordenadas: -25.966213, 32.567451
- Telefone: 86 568 0167
- WhatsApp: +258 85 320 6105
- Horário apresentado: Sempre aberto
- Facebook: página oficial fornecida pelo cliente

Os dados da loja existem num único registo de configuração e podem ser alterados no painel. O header, footer, mapa, página de marcação e links de contacto lêem sempre esse registo.

## Funcionalidades disponíveis

- Homepage completa, responsiva e orientada para catálogo.
- Catálogo com pesquisa, categoria, disponibilidade, promoções e ordenação.
- Detalhe do produto por `?id=`, produtos relacionados e contacto WhatsApp.
- Página de promoções que exclui campanhas expiradas ou inactivas.
- Marcação de consulta com data mínima, horários configuráveis e bloqueio de duplicados.
- Localização com mapa, telefone, WhatsApp, Facebook e direcções exactas.
- Interface de teste virtual com selecção de armação, início e paragem segura da câmara e imagem de sobreposição separada.
- Login e protecção frontend das páginas administrativas.
- Dashboard e CRUD de produtos, categorias e promoções.
- Upload, pré-visualização, substituição e remoção de imagens com FileReader/Data URL.
- Gestão do estado das marcações, horários semanais e configuração completa da loja.
- Seed automático com 12 produtos, cinco categorias, promoções activas/inactivas e marcações de demonstração.

## Teste rápido da integração

1. Entre no painel e altere o nome, preço ou fotografia de um produto.
2. Abra o catálogo público e confirme a alteração.
3. Desactive o produto e confirme que deixa de aparecer com o filtro de disponíveis activo.
4. Crie uma promoção válida e confirme a apresentação na página pública de promoções.
5. Altere telefone, WhatsApp, localização ou logótipo e volte a abrir uma página pública.
6. Faça uma marcação pública e confirme que surge imediatamente em **Marcações** no painel.

Para repor os dados iniciais, limpe os dados do site no navegador. Imagens carregadas como Base64 ocupam espaço no `localStorage`; para a demonstração, o limite por ficheiro é 1,5 MB.

## Dependências do backend

Continuam pendentes para a fase de backend: API REST, PostgreSQL, autenticação e autorização seguras, armazenamento real de ficheiros, validação no servidor, protecção dos dados pessoais, HTTPS de produção e persistência partilhada entre dispositivos.

A página de teste virtual já acede à câmara e apresenta uma sobreposição de demonstração. O seguimento facial em tempo real com MediaPipe Face Mesh permanece isolado para integração na versão com teste virtual. A câmara exige `localhost` ou HTTPS e nunca é gravada pelo frontend.
