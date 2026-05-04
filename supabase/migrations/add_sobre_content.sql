-- Sobre page CMS content
-- Stores all editable text for the /sobre page as a single JSON row.

create table if not exists sobre_content (
  id int primary key default 1,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint sobre_single_row check (id = 1)
);

-- Seed default content (all non-ASCII chars use \uXXXX JSON escapes — encoding-safe)
insert into sobre_content (id, data) values (1, '{
  "hero": {
    "prelabel": "Brutuspolus \u00b7 Streamer \u00b7 Portugal",
    "title": "ENTRA NA ARENA",
    "subtitle": "Sem filtros \u00b7 Sem encena\u00e7\u00e3o \u00b7 S\u00f3 a arena",
    "history_label": "A Hist\u00f3ria",
    "layout": "centered",
    "bg_image": null
  },
  "bio": {
    "p1_bold": "Apaixonado pelo gambling",
    "p1": "desde os tempos em que estudava na Universidade de Direito de Coimbra. O poker era o passatempo nas pausas dos estudos \u2014 e foi a\u00ed que as slots apareceram pela primeira vez, a jogar com os amigos. Estava descoberta a entrada para este mundo.",
    "p2": "Encontrei a Twitch \u2014 era a primeira vez que entrava nesta plataforma. Criei uma conta, pesquisei artigos, vi v\u00eddeos de como configurar o canal e comecei esta aventura. Seria suficiente? Achei que n\u00e3o.",
    "p3": "Fui evoluindo cada vez mais o canal e, comigo, foi crescendo tamb\u00e9m uma equipa que me tem ajudado a concretizar este projeto.",
    "p3_highlight": "O que era um momento de divers\u00e3o, passou a ser o meu trabalho di\u00e1rio.",
    "quote": "Aqui n\u00e3o h\u00e1 hist\u00f3rias bonitas.\nS\u00f3 a verdade do jogo.",
    "layout": "sidebar",
    "stats": [
      { "value": "1990", "label": "Nascido" },
      { "value": "Coimbra", "label": "Origem" },
      { "value": "2020", "label": "Streaming Slots desde" },
      { "value": "100%", "label": "Real e Ao Vivo" }
    ]
  },
  "arena": {
    "section_title": "O que acontece na arena",
    "section_desc": "Cada sess\u00e3o tem o seu prop\u00f3sito. Cada batalha, o seu nome.",
    "layout": "grid",
    "types": [
      { "icon": "\ud83c\udfc6", "label": "Liga dos Brutus", "badge": "Torneio", "desc": "Todas as semanas selecionamos jogadores de diferentes formas para competir no torneio de final do m\u00eas. Quem entra, combate.", "variant": "gold", "href": "/liga-dos-brutus" },
      { "icon": "\ud83c\udfb0", "label": "Bonus Hunt", "badge": "Campanhas", "desc": "Sempre a tentar aumentar o card\u00e1pio. Acumula-se muni\u00e7\u00e3o, escolhe-se o momento, entra-se com for\u00e7a total.", "variant": "crimson", "href": "/bonus-hunt" },
      { "icon": "\ud83c\udf3e", "label": "Slot Farm", "badge": "Marathons", "desc": "Quando castigamos mesmo muito. As sess\u00f5es mais longas e intensas da arena \u2014 sem pausas, sem piedade.", "variant": "crimson", "href": null },
      { "icon": "\ud83c\udfae", "label": "Slot Request", "badge": "Tu decides", "desc": "Fazes tu o Bonus Hunt. O chat escolhe os slots, define as apostas. A arena \u00e9 de todos.", "variant": "gold", "href": null }
    ]
  },
  "community": {
    "blockquote_line1": "N\u00e3o \u00e9 apenas um canal Twitch,",
    "blockquote_emphasis": "\u00e9 uma fam\u00edlia",
    "blockquote_line2": "que partilha o gosto pelo gambling.",
    "desc": "Nas streams de Brutuspolus, ningu\u00e9m est\u00e1 de fora. A comunidade decide, arrisca e celebra \u2014 cada spin \u00e9 vivido por todos, em simult\u00e2neo, com peso real.",
    "layout": "split",
    "cards": [
      { "icon": "\ud83c\udfc6", "title": "Leaderboard", "desc": "A tabela dos nossos Brutus", "href": "/leaderboard" },
      { "icon": "\u2694", "title": "Bruta do M\u00eas", "desc": "Onde partilhas as tuas vit\u00f3rias e ganhas pr\u00e9mios", "href": "/hall-of-victories" },
      { "icon": "\ud83c\udf81", "title": "Giveaways", "desc": "Sorteios que decorrem na nossa live stream", "href": "/giveaways" }
    ]
  },
  "timeline": {
    "section_title": "A linha do tempo",
    "layout": "left-line",
    "items": [
      { "id": "1", "year": "1990", "label": "Nasce em Coimbra", "desc": "Coimbra, Portugal. O in\u00edcio de tudo.", "image": null, "video": null, "accent": "gold" },
      { "id": "2", "year": "2015", "label": "Poker & Slots em Coimbra", "desc": "Durante os anos na Universidade de Direito, o poker era o passatempo. As slots vieram nas pausas dos estudos \u2014 e foi a\u00ed que este mundo come\u00e7ou.", "image": null, "video": null, "accent": "none" },
      { "id": "3", "year": "2020", "label": "In\u00edcio do Streaming", "desc": "Encontrou a Twitch pela primeira vez. Criou uma conta, pesquisou, aprendeu e lan\u00e7ou o canal. O que era divers\u00e3o passou a ser trabalho di\u00e1rio.", "image": null, "video": null, "accent": "crimson" },
      { "id": "4", "year": "Hoje", "label": "A Arena Est\u00e1 Aberta", "desc": "Uma equipa, uma comunidade e um canal que cresceu com o seu criador. A arena aguarda.", "image": null, "video": "https://www.twitch.tv/brutuspolus", "accent": "gold" }
    ]
  },
  "closing": {
    "text": "A arena est\u00e1 aberta \u00b7 A fam\u00edlia aguarda"
  }
}'::jsonb)
on conflict (id) do update set data = EXCLUDED.data, updated_at = now();
