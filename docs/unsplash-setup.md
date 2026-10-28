# Unsplash — configuração e validação

Esta feature está em desenvolvimento na branch `feat/spec-001-unsplash-drawing` e é descrita por [SPEC-001](../specs/SPEC-001-unsplash-drawing-mode.md).

## Chave pública

Configure `EXPO_PUBLIC_UNSPLASH_ACCESS_KEY` no ambiente de build (por exemplo, em um arquivo `.env.local` ignorado pelo Git ou em variáveis EAS). A chave é pública no bundle do aplicativo e **não é um segredo**. Nunca grave credenciais privadas da conta Unsplash no cliente.

A tela Configurações Unsplash persiste termos, filtro e timer via AsyncStorage. O modo de treino cria uma sessão nova ao abrir. Não há download nem cache persistente implementado pela aplicação.

## Instalação e validação pendentes

A branch adiciona AsyncStorage em `package.json`; é necessário executar `pnpm install` com acesso ao registry e versionar o `pnpm-lock.yaml` atualizado antes do merge. Não altere versões do SDK Expo da modernização paralela.

Verificações a executar em ambiente de desenvolvimento:
1. `pnpm install --frozen-lockfile=false` e versionar o lockfile.
2. `pnpm exec tsc --noEmit`.
3. `node --experimental-strip-types --test tests/unsplash.util.test.mjs`.
4. Validar manualmente Android/iOS: navegação, permissões, fotos verticais/horizontais, pinch/pan, créditos, timer 10s, pausa em background, próxima, falha de rede e 429.
5. Validar regressão dos modos Referências, Aleatório e Contagem regressiva.
6. Executar build EAS no perfil aplicável.

**Limitações conhecidas:** o tratamento de 429 é conservador e impede novas chamadas por um intervalo; a política real de cota depende do aplicativo Unsplash. O cache nativo pode sobreviver à sessão. Esta branch ainda não passou por build, testes de integração ou revisão final.
