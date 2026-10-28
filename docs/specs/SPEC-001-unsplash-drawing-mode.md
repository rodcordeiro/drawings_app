# SPEC-001 — Modo Unsplash para referências de desenho

**Status:** Aprovado para especificação; implementação não autorizada  
**Repositório:** `rodcordeiro/drawings_app`  
**Branch de referência:** `develop` (revalidar HEAD antes de implementar)  
**Data:** 2026-10-28  
**Origem:** quatro rodadas de levantamento, 37 decisões confirmadas e defaults técnicos aprovados.

## 1. Objetivo e limites

Adicionar à Home um modo independente **Unsplash** que apresenta fotografias aleatórias como referências de desenho, com cronômetro opcional, gerenciamento de termos de pesquisa e pré-carregamento da próxima fotografia. Preservar os modos existentes: Referências, Aleatório e Contagem regressiva.

**Fora do escopo:** favoritos, download/salvamento de fotografias, histórico persistente de sessões, comparação perceptual de imagens, backend/proxy próprio, garantia de operação offline, atualização do SDK nesta entrega.

## 2. Base técnica e integração paralela

Na inspeção da branch `develop` em 2026-10-28, o `package.json` declara Expo `~58.0.21`, React Native `0.88.0`, React `19.3.0`, React Navigation 7, Reanimated 4 e Gesture Handler 3. O projeto está sendo atualizado em paralelo; **não presumir SDK 49** nem congelar as versões aqui. Revalidar `develop`, lockfile, scripts e dependências antes de implementar. Não modificar versões por conta desta feature salvo dependências estritamente necessárias e compatíveis com a base final.

Arquivos existentes relevantes: `src/features/home/index.tsx`, `src/features/Drawing/index.tsx`, `src/routes/index.tsx`, `src/hooks/references/index.tsx`, `src/utils/contants.util.ts`. O modo Drawing atual usa `DRAWING_TIME` fixo e `setInterval`; sua migração deve manter o comportamento funcional anterior.

## 3. Requisitos funcionais

- **RF-01 — Navegação:** adicionar botão Unsplash à Home, rota de treino Unsplash e rota de Configurações. Manter rotas e ações atuais.
- **RF-02 — Busca:** consumir `GET https://api.unsplash.com/photos/random` com `Authorization: Client-ID <ACCESS_KEY>`. A chave pública será configurada por variável de ambiente de build, não incluída no repositório. A chave embutida no app continua extraível; registrar risco de abuso de cota.
- **RF-03 — Termos:** permitir adicionar, editar e excluir tags. Normalizar espaços e impedir duplicatas equivalentes sem diferenciar maiúsculas/minúsculas. Escolher um termo por fotografia, usando embaralhamento sem reposição até esgotar o ciclo; então embaralhar novamente. Se não houver termos, omitir `query`.
- **RF-04 — Conteúdo:** configurações permitem `content_filter=high|low`, padrão `high`. Aceitar todas as orientações, preservando proporção.
- **RF-05 — Exibição:** exibir fotografia ajustada à área disponível, com zoom e pan, sem distorção. Botão de informações abre atribuição ao fotógrafo, links para perfil e fotografia no Unsplash; preservar parâmetros de rastreamento fornecidos pela API.
- **RF-06 — Timer:** opcional, duração de 10 a 7200 segundos (inclusive), com entrada em segundos/minutos; configurações persistidas e ajuste durante treino. Começar somente após `onLoad`/sucesso de carregamento visual da fotografia. Ao alterar duração durante treino, reiniciar com novo valor. Timer desligado: troca somente manual.
- **RF-07 — Controles:** pausar, retomar, próxima fotografia, reiniciar timer e ajustar duração. Troca manual reinicia a contagem quando a nova fotografia estiver carregada. Ignorar toques adicionais em Próxima enquanto uma troca está em andamento.
- **RF-08 — Segundo plano:** pausar ao perder estado ativo do app; retornar em pausa, aguardando retomada explícita (proposta de operacionalização da decisão 'pausar e retomar ao voltar': ver seção 10).
- **RF-09 — Troca automática:** ao zerar, usar a próxima fotografia pré-carregada; se não estiver pronta, manter a atual com indicador de carregamento e timer parado. Começar novo ciclo somente quando a nova fotografia estiver visível.
- **RF-10 — Pré-carregamento:** manter no máximo uma próxima fotografia preparada por sessão. Não pré-carregar lotes. O cache de imagem é restrito ao comportamento nativo e à sessão; não implementar histórico/cache persistente próprio.
- **RF-11 — Não repetição:** registrar IDs de fotografias **exibidas** durante a sessão; não exibir novamente um ID. Ao abandonar sessão, descartar conjunto. Identidade por `photo.id`, não por URL.
- **RF-12 — Recuperação de busca:** quando um termo não fornecer resultado utilizável, testar outros termos ainda não tentados no ciclo de recuperação, no máximo uma vez cada; se todos falharem por ausência de correspondência, tentar uma busca sem `query` e avisar. Erros de autenticação, rede e limitação não devem ser tratados como simples 'sem correspondência'.
- **RF-13 — Falhas:** até três tentativas por operação para falhas transitórias, com backoff progressivo e cancelamento ao sair da tela; respeitar `Retry-After` quando fornecido em 429 e não efetuar novas buscas enquanto houver bloqueio. Oferecer Tentar novamente quando permitido. Se falhar o pré-carregamento, não retirar a imagem atual.
- **RF-14 — Persistência:** AsyncStorage com schema versionado, defaults e validação na leitura; persistir termos, duração, timer habilitado e filtro. Não persistir fotografia atual, IDs usados nem tempo restante.
- **RF-15 — Ausência da chave:** exibir erro claro e recuperável, sem travar o app. Não registrar a chave em logs.

## 4. Contratos sugeridos

### Configurações (persistência versionada)

```ts
type UnsplashSettingsV1 = {
  version: 1;
  searchTerms: string[];
  timerEnabled: boolean;
  timerDurationSeconds: number; // inteiro 10..7200
  contentFilter: 'high' | 'low';
};
```

Valores padrão propostos: `searchTerms=[]`, `timerEnabled=true`, `timerDurationSeconds=DRAWING_TIME` se válido, caso contrário 60, `contentFilter='high'`. Na leitura, migrar versão reconhecida, validar campos individualmente e preservar os válidos; corrupção irrecuperável retorna defaults e mensagem não bloqueante. O modo Unsplash possui preferências próprias; migração do timer legado não deve alterar os padrões dos outros modos.

### Entidade da fotografia

```ts
type UnsplashPhoto = {
  id: string;
  imageUrl: string; // URL oficial de photo.urls, sem reescrever parâmetros
  width: number;
  height: number;
  photographerName: string;
  photographerUrl: string;
  photoUrl: string;
  downloadLocation?: string;
};
```

O serviço valida campos obrigatórios; URLs de perfil/foto devem preservar parâmetros retornados e, quando aplicável, a atribuição `utm_source`/`utm_medium` exigida pelas diretrizes Unsplash. Não chamar `download_location` para simples visualização; avaliar apenas caso um recurso futuro faça download.

### Hook de timer

`useDrawingTimer({durationSeconds, enabled, startPaused?})` expõe `remainingSeconds`, `status`, `start`, `pause`, `resume`, `reset`, `setDuration` e callback `onComplete`. A contagem deve ser resistente a atrasos do event loop (tempo decorrido monotônico ou timestamp-base), ter cleanup de listeners e intervalos e não duplicar `onComplete`. A integração com AppState fica isolada e testável.

### Hook de sessão

`useUnsplashSession(settings)` gerencia `currentPhoto`, `nextPhoto`, `seenPhotoIds`, `status`, `error`, `next()`, `retry()` e `dispose()`. O carregamento de imagem e o estado de API são distintos. Cada busca/troca usa token de geração ou AbortController para ignorar respostas obsoletas. Uma única troca ativa por vez. O pré-carregamento não deve acionar troca automática sem evento de timer ou comando explícito.

### Serviço Unsplash

`getRandomPhoto({query?,contentFilter,signal?})` retorna entidade validada ou erro tipado: `missing_key`, `unauthorized`, `rate_limited`, `network`, `server`, `no_result`, `invalid_payload`. Usar `count` omitido para resposta de uma foto. Preservar `photo.urls` e metadados de atribuição. Distinguir `403`/limite e `401` de ausência de resultados.

## 5. Máquina de estados e invariantes

Estados da sessão: `idle`, `loading_initial`, `ready`, `transitioning`, `waiting_next`, `recoverable_error`, `disposed`. Timer separado: `disabled`, `paused`, `running`, `completed`.

Invariantes:
1. Timer só roda com imagem atual carregada e sessão ativa.
2. A imagem atual permanece até a próxima estar carregada; erro não a remove.
3. Uma imagem com ID já exibido não pode voltar a ser exibida na sessão.
4. Somente uma transição pode estar em andamento; respostas obsoletas são descartadas.
5. No máximo uma fotografia pré-carregada à frente.
6. Saída da tela cancela/ignora efeitos pendentes e limpa timers.
7. `429` suspende novas buscas até o prazo conhecido; não aplicar retry cego.
8. Não existe ciclo infinito de fallback ou busca por duplicata.

## 6. Regras operacionais para casos extremos

- **Carregamento visual:** a resposta HTTP com metadados não autoriza iniciar timer. A imagem atual deve emitir sucesso de carregamento. Em falha visual, tentar obter outra fotografia dentro dos limites; permitir retry manual.
- **Duração curta:** com 10 segundos e rede lenta, aguardar próxima imagem mantendo a atual; não acumular disparos de conclusão.
- **Busca sem termos:** uma chamada aleatória sem `query`; sem ciclos de fallback de termos.
- **Filtro:** aplicar a escolha do usuário a todas as buscas, inclusive fallback sem termo.
- **Duplicata:** rejeitar ID já exibido, tentar novamente dentro de um orçamento finito (proposta: 3 tentativas por obtenção); se esgotar, exibir erro recuperável. A foto pré-carregada não é considerada exibida até a transição.
- **Termos:** termo com apenas espaços não é válido; limitar comprimento e quantidade conforme limites do endpoint e ergonomia da UI (validar na implementação).
- **Timer desativado:** não iniciar contagem nem fazer troca automática; o pré-carregamento continua permitido.
- **Créditos:** botão de informação acessível sem obstruir o desenho; links externos abrem destino apropriado.
- **Conexão offline:** a foto atual pode permanecer; próxima busca falha de forma recuperável. Não prometer offline-first.

## 7. Arquivos/módulos previstos (não criados)

- `src/features/unsplash/...` — tela de treino e componentes.
- `src/features/settings/...` — tela de configurações.
- `src/hooks/useDrawingTimer.ts` — timer reutilizável.
- `src/hooks/useUnsplashSession.ts` — orquestração de sessão.
- `src/services/unsplash.ts` — cliente HTTP e normalização.
- `src/stores/unsplashSettings.ts` — AsyncStorage, validação e migração.
- `src/routes/index.tsx`, `src/features/home/index.tsx`, tipos de navegação — integração.
- Testes de hooks, serviço, armazenamento e regras de negócio, com ferramentas compatíveis com a base modernizada.

Os caminhos são indicativos, sujeitos à convenção final do repositório. Não compartilhar o cliente HTTP legado de referências caso seu `baseURL` não corresponda à API Unsplash.

## 8. Critérios de aceitação (cenários verificáveis)

1. **Home:** opção Unsplash abre tela independente; demais opções funcionam como antes.
2. **Primeira foto:** timer não corre durante busca HTTP nem carregamento visual.
3. **Timer ligado:** troca automaticamente ao zerar; próximo ciclo só começa após exibir nova foto.
4. **Timer desligado:** imagem não troca sem comando manual.
5. **Troca manual:** reseta duração; múltiplos toques durante troca não geram múltiplas transições.
6. **Pausa:** pausa manual e por background não perdem tempo indevidamente.
7. **Configurações:** tags, filtro, habilitação e duração persistem entre reinícios; valores inválidos são corrigidos.
8. **Termos:** ciclo embaralhado sem repetição até esgotar; sem termos busca aleatória; fallback sem filtro de query após esgotar termos sem resultado.
9. **Repetição:** IDs já exibidos não reaparecem na sessão; nova sessão reinicia histórico.
10. **Pré-carregamento:** apenas uma próxima imagem; falha não remove atual.
11. **Rede:** 429 e Retry-After respeitados; timeout/5xx com retry limitado; 401/ausência de chave com mensagem apropriada.
12. **Visualização:** todas orientações com proporção correta, zoom e pan.
13. **Créditos:** botão de informação apresenta fotógrafo e links válidos.
14. **Regressão:** Aleatório, Contagem regressiva e Referências mantêm seus fluxos anteriores.
15. **Qualidade:** testes unitários automatizados para timer, sessão, seleção de termos, duplicatas, falhas, persistência e limpeza de recursos; checklist manual em dispositivo.

## 9. Sequência futura sugerida (não autorizada ainda)

1. Validar branch `develop`, versões, instalação e baseline de testes.
2. Criar armazenamento de configurações e serviço Unsplash com testes.
3. Extrair `useDrawingTimer` e migrar modos existentes sem regressão.
4. Implementar sessão, pré-carregamento, recuperação e testes.
5. Integrar telas, navegação, gestos e atribuição.
6. Validar cenários de erro, regressão e build; documentar configuração da Access Key.

## 10. Pontos de atenção para revisão antes de implementar

- **SDK paralelo:** verificar se a modernização alterou a arquitetura, dependências e convenções. Este documento não autoriza alterar dependências da atualização paralela.
- **Pausa em background:** a entrevista definiu 'pausar e retomar ao voltar'; a regra operacional aqui propõe retornar pausado para evitar avanço inesperado. Confirmar se o retorno deve ser automático antes de codificar.
- **Atribuição Unsplash:** validar diretrizes vigentes de hotlinking, atribuição, rastreamento e requisitos de produção no momento da implementação.
- **Chave pública:** variável de ambiente em build evita commit da chave, mas não a mantém secreta dentro do binário.
- **Política de cache:** cache nativo pode persistir no dispositivo conforme a plataforma; 'somente durante a sessão' significa que a aplicação não manterá cache persistente próprio nem histórico.
- **Timeout e limite de busca:** definir valores concretos com testes; a especificação fixa retry máximo e ausência de loops, não exige duração específica de timeout.
- **Compatibilidade do hook:** preservar semântica de `params.image` e `params.disableClock` no modo Drawing legado.

## 11. Referências

- https://unsplash.com/documentation
- https://help.unsplash.com/en/articles/2511245-unsplash-api-guidelines
- https://github.com/rodcordeiro/drawings_app/tree/develop

**Restrição de autorização:** este documento é a única entrega autorizada. Nenhum código de produção, issue, PR ou alteração de dependências deve ser criado sem nova autorização.
