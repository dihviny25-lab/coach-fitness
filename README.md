# Coach Fitness

App web (React + Supabase) para treino, medidas corporais e nutrição, feito para uso pessoal (você e sua esposa, cada um com sua conta e dados privados).

## O que já funciona
- Login / criação de conta (e-mail e senha, com confirmação por e-mail)
- Onboarding em 3 etapas: perfil (sexo, idade, altura, peso, objetivo, nível, frequência semanal), alimentação (padrão alimentar, restrições) e rotina (dias disponíveis, equipamentos, tempo por treino)
- Cálculo automático de meta de calorias e macros (TMB + nível de atividade + objetivo)
- Geração automática de plano de treino (split por frequência/objetivo/equipamento), com botão para iniciar o treino do dia
- Sugestão de progressão de carga: com base na última sessão daquele exercício, sugere aumentar carga, repetir ou tentar mais uma rep
- Vídeo de execução (YouTube) para cada exercício da biblioteca
- Treino: criar treino, registrar séries (exercício, reps, carga, RPE), histórico
- Medidas: peso, %gordura, circunferências, gráfico de evolução do peso
- Nutrição: registrar refeições por uma lista de alimentos (ou "alimento livre" só com calorias), resumo diário vs. meta, e sugestão automática de cardápio (respeitando padrão alimentar)
- Dashboard com dicas simples do "coach" (ex: dias sem treinar, distância da meta calórica)
- PWA instalável (funciona como app no celular, com ícone próprio)
- Cada usuário só vê seus próprios dados (segurança via RLS no Supabase)

## Como rodar localmente (para editar/testar)
Pré-requisitos: [Node.js](https://nodejs.org) instalado.

```bash
npm install
npm run dev
```

Abra o endereço que aparecer no terminal (geralmente http://localhost:5173).

As credenciais do Supabase já estão configuradas no arquivo `.env` (variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`). Essa chave é pública por natureza (protegida pelas regras de segurança do banco), então não tem problema ela estar no código.

## Como colocar no ar (deploy) — sem precisar programar

**Opção mais rápida: Netlify Drop**
1. Rode `npm install` e depois `npm run build` (gera a pasta `dist`)
2. Acesse https://app.netlify.com/drop
3. Arraste a pasta `dist` para a página
4. Pronto — você recebe um link público na hora. Para deixar o link fixo, crie uma conta grátis na Netlify e "reivindique" o site.

**Opção recomendada a longo prazo: Vercel + GitHub**
1. Suba este projeto para um repositório no GitHub (veja seção abaixo)
2. Crie uma conta em https://vercel.com (pode entrar com GitHub)
3. "Add New Project" → selecione o repositório
4. Nas variáveis de ambiente, adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (valores estão no `.env`)
5. Deploy — a Vercel atualiza automaticamente a cada vez que você enviar mudanças ao GitHub

## Subir para o GitHub
O projeto já está inicializado como repositório git local (com o primeiro commit feito). Para enviar para o GitHub:

1. Crie um repositório vazio em https://github.com/new (ex: `coach-fitness`, não marque "Add README")
2. No terminal, dentro da pasta do projeto:
```bash
git remote add origin https://github.com/SEU_USUARIO/coach-fitness.git
git branch -M main
git push -u origin main
```
3. Se pedir login, use um Personal Access Token do GitHub no lugar da senha (Settings → Developer settings → Personal access tokens)

## Banco de dados
O backend já está criado e ativo no Supabase (projeto `coach-fitness-app`). Tabelas: `profiles`, `body_measurements`, `workouts`, `workout_sets`, `exercises`, `foods`, `meal_logs`. Todas com Row Level Security — cada pessoa só acessa seus próprios registros. `exercises` e `foods` são bibliotecas compartilhadas (28 exercícios e 25 alimentos básicos já cadastrados) que dá pra ir completando com o tempo.

## Próximos passos sugeridos
- Fotos de progresso
- Notificações/lembretes

## Login com Google
O botão "Continuar com Google" já está no app. Para ativá-lo de fato, faltam 2 passos que só você pode fazer (usam sua conta):

1. **Google Cloud Console** (https://console.cloud.google.com/apis/credentials): crie um projeto, configure a "tela de consentimento OAuth" e crie uma credencial "ID do cliente OAuth" do tipo "Aplicativo da Web". Em "URIs de redirecionamento autorizados", adicione:
   `https://qejhceflonyjopjzmyaq.supabase.co/auth/v1/callback`
2. **Supabase Dashboard** (https://supabase.com/dashboard/project/qejhceflonyjopjzmyaq/auth/providers): habilite o provedor "Google" e cole o Client ID e Client Secret gerados no passo 1.

Depois disso o botão passa a funcionar sem precisar mexer no código.

## GitHub Pages
Este repositório já vem com um workflow (`.github/workflows/deploy.yml`) que builda e publica automaticamente no GitHub Pages a cada push na branch `main`. Ele precisa de 2 "Secrets" configurados no repositório (Settings → Secrets and variables → Actions):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

(valores estão no arquivo `.env`). Depois do primeiro push, o site fica em `https://SEU_USUARIO.github.io/coach-fitness/`.
