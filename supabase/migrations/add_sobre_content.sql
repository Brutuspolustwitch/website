-- Sobre page CMS content
-- Stores all editable text for the /sobre page as a single JSON row.

create table if not exists sobre_content (
  id int primary key default 1,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint sobre_single_row check (id = 1)
);

-- Seed default content
insert into sobre_content (id, data) values (1, '{
  "hero": {
    "prelabel": "Brutuspolus · Streamer · Portugal",
    "title": "ENTRA NA ARENA",
    "subtitle": "Sem filtros · Sem encenação · Só a arena",
    "history_label": "A História"
  },
  "bio": {
    "p1_bold": "Apaixonado pelo gambling",
    "p1": "desde os tempos em que estudava na Universidade de Direito de Coimbra. O poker era o passatempo nas pausas dos estudos — e foi aí que as slots apareceram pela primeira vez, a jogar com os amigos. Estava descoberta a entrada para este mundo.",
    "p2": "Encontrei a Twitch — era a primeira vez que entrava nesta plataforma. Criei uma conta, pesquisei artigos, vi vídeos de como configurar o canal e comecei esta aventura. Seria suficiente? Achei que não.",
    "p3": "Fui evoluindo cada vez mais o canal e, comigo, foi crescendo também uma equipa que me tem ajudado a concretizar este projeto.",
    "p3_highlight": "O que era um momento de diversão, passou a ser o meu trabalho diário.",
    "quote": "Aqui não há histórias bonitas.\nSó a verdade do jogo.",
    "stats": [
      { "value": "1990", "label": "Nascido" },
      { "value": "Coimbra", "label": "Origem" },
      { "value": "2020", "label": "Streaming Slots desde" },
      { "value": "100%", "label": "Real e Ao Vivo" }
    ]
  },
  "arena": {
    "section_title": "O que acontece na arena",
    "section_desc": "Cada sessão tem o seu propósito. Cada batalha, o seu nome.",
    "types": [
      { "icon": "🏆", "label": "Liga dos Brutus", "badge": "Torneio", "desc": "Todas as semanas selecionamos jogadores de diferentes formas para competir no torneio de final do mês. Quem entra, combate.", "variant": "gold", "href": "/liga-dos-brutus" },
      { "icon": "🎰", "label": "Bonus Hunt", "badge": "Campanhas", "desc": "Sempre a tentar aumentar o cardápio. Acumula-se munição, escolhe-se o momento, entra-se com força total.", "variant": "crimson", "href": "/bonus-hunt" },
      { "icon": "🌾", "label": "Slot Farm", "badge": "Marathons", "desc": "Quando castigamos mesmo muito. As sessões mais longas e intensas da arena — sem pausas, sem piedade.", "variant": "crimson", "href": null },
      { "icon": "🎮", "label": "Slot Request", "badge": "Tu decides", "desc": "Fazes tu o Bonus Hunt. O chat escolhe os slots, define as apostas. A arena é de todos.", "variant": "gold", "href": null }
    ]
  },
  "community": {
    "blockquote_line1": "Não é apenas um canal Twitch,",
    "blockquote_emphasis": "é uma família",
    "blockquote_line2": "que partilha o gosto pelo gambling.",
    "desc": "Nas streams de Brutuspolus, ninguém está de fora. A comunidade decide, arrisca e celebra — cada spin é vivido por todos, em simultâneo, com peso real.",
    "cards": [
      { "icon": "🏆", "title": "Leaderboard", "desc": "A tabela dos nossos Brutus", "href": "/leaderboard" },
      { "icon": "⚔", "title": "Bruta do Mês", "desc": "Onde partilhas as tuas vitórias e ganhas prémios", "href": "/hall-of-victories" },
      { "icon": "🎁", "title": "Giveaways", "desc": "Sorteios que decorrem na nossa live stream", "href": "/giveaways" }
    ]
  },
  "timeline": {
    "section_title": "A linha do tempo",
    "items": [
      { "year": "1990", "label": "Nasce em Coimbra", "desc": "Coimbra, Portugal. O início de tudo.", "video": null },
      { "year": "2015", "label": "Poker & Slots em Coimbra", "desc": "Durante os anos na Universidade de Direito, o poker era o passatempo. As slots vieram nas pausas dos estudos — e foi aí que este mundo começou.", "video": null },
      { "year": "2020", "label": "Início do Streaming", "desc": "Encontrou a Twitch pela primeira vez. Criou uma conta, pesquisou, aprendeu e lançou o canal. O que era diversão passou a ser trabalho diário.", "video": null },
      { "year": "Hoje", "label": "A Arena Está Aberta", "desc": "Uma equipa, uma comunidade e um canal que cresceu com o seu criador. A arena aguarda.", "video": "https://www.twitch.tv/brutuspolus" }
    ]
  },
  "closing": {
    "text": "A arena está aberta · A família aguarda"
  }
}'::jsonb)
on conflict (id) do nothing;
