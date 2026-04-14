"use client";

import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const sections = [
  {
    title: "1. Introdução",
    content: `Bem-vindo ao BrutusPolus! Antes de começar, pedimos que leia os Termos e Condições (T&C) antes de usar o nosso website. Leia atentamente para evitar confusões e para que a sua experiência de utilizador seja a melhor possível! Se não concordar em aceitar e seguir todas as condições, não abra uma conta e/ou use o website. A continuação do uso do website indicará a aceitação das condições. As condições foram promulgadas em 03.07.2024. Queremos que desfrute do tempo que passa aqui, e porque este é um website onde discutimos, mostramos vídeos e oferecemos ofertas relacionadas com casinos que envolvem jogo, existe um conjunto de leis e regulamentos que regulam as nossas atividades. Estes termos são explicados da forma mais clara possível. Os termos do BrutusPolus são a forma que temos de o informar sobre o que pode e não pode fazer no BrutusPolus, como usaremos a sua informação pessoal e como gerimos o website. Se ainda tiver dúvidas após ler os T&C, contacte a equipa de suporte através do seguinte formato: Envie um email para support@brutuspolus.com que se encontra no separador "Contacto" no fundo do website BrutusPolus.`,
  },
  {
    title: "2. Os Princípios Básicos",
    content: `Os Termos são um acordo vinculativo entre o BrutusPolus e o utilizador, e ao usar o website, o utilizador concorda que leu e aceitou os termos e quaisquer alterações aos mesmos. Se não concordar com os termos, não deve registar-se ou continuar a usar o website. Podemos alterar estes termos a qualquer momento. Quando o fizermos substancialmente, contactaremos o utilizador e informá-lo-emos antecipadamente das novas condições.`,
  },
  {
    title: "3. Definições",
    content: `Os seguintes termos serão usados sob estas condições: "Oferta" cobre todas as ofertas promocionais que oferecem uma recompensa tangível, seja de natureza pecuniária ou não pecuniária, incluindo, mas não limitado a: prémios de sorteio, prémios de loja, ofertas de boas-vindas, negócios patrocinados pelo casino que são limitados a utilizadores do BrutusPolus, rondas/bónus grátis, recompensas pecuniárias patrocinadas, etc. Para mais informações sobre as ofertas que promovemos no nosso site, contacte o suporte ao cliente de cada parceiro. "Termos" são estes termos, condições e regras com os quais concorda ao usar o website. "Website" https://www.brutuspolus.com, e incluindo, se aplicável, qualquer versão móvel e aplicação móvel do mesmo. Palavras como "nós", "nosso" referem-se ao BrutusPolus, à equipa e ao website https://www.brutuspolus.com. "Utilizador" refere-se a qualquer pessoa física ou jurídica registada no nosso website, bem como visitantes que acedem ao website, sem registo prévio. Quando conveniente, as palavras "tu" e "teu" referem-se aos nossos utilizadores e/ou convidados. "A Sua Conta" é a sua conta de utilizador no website. "Política de Privacidade" refere-se à forma como tratamos os dados pessoais do utilizador no nosso website, de acordo com e em conformidade com as leis e regulamentos de proteção de dados exigidos e relevantes. Sob a Lei de Proteção de Dados, referimo-nos ao regulamento que rege esta matéria, conforme estipulado pelo RGPD (Regulamento Geral de Proteção de Dados Nº 679/2016/CE). Além disso, sob a lei de proteção de dados, também nos referimos aos termos estabelecidos na Diretiva 58/2002/CE, alterada em 2006 e posteriormente alterada em 2009, que estipula a política de cookies do website. "Cookie" é um pequeno ficheiro de texto colocado no dispositivo do utilizador pelo nosso website. São usados para oferecer a melhor experiência ao utilizador. "Dispositivo do Utilizador" — Um dispositivo portátil, computador, tablet ou qualquer dispositivo usado para aceder ao website.`,
  },
  {
    title: "4. Mini Jogos e Informação",
    content: `O website atua como um local de "jogo social" e não fornece serviços de jogo online pagos. Não somos um casino. Nenhum dinheiro real é movido no nosso website e nunca lhe pediremos para gastar fundos no nosso website. Para utilizadores que procuram ofertas de jogo real, fornecemos informações sobre websites que oferecem serviços de jogo de casino, apenas para fins informativos e promocionais. Também fornecemos entretenimento através de conteúdo em vídeo, análises de jogos e artigos apenas para fins informativos. O objetivo deste website é oferecer aos seguidores do BrutusPolus uma experiência divertida e informativa.\n\n4.1 Os pontos usados no website não podem ser obtidos ou trocados por dinheiro real de forma alguma. O saldo de pontos é reiniciado quando a loja fica sem stock e não tem valor monetário.\n\n4.2 O ganho máximo de cada aposta é de 100.000 pontos.`,
  },
  {
    title: "5. Pontos Virtuais",
    content: `Os pontos virtuais ganhos através do site não têm valor monetário real e não podem ser trocados por dinheiro. São usados apenas dentro do site para comprar produtos ou serviços oferecidos na "Loja".`,
  },
  {
    title: "6. Política de Reembolso",
    content: `Não oferecemos reembolso para compras feitas na loja online, pois os produtos oferecidos são de natureza digital e serviços.`,
  },
  {
    title: "7. Secções do Site",
    content: `Ao aceder ao site https://www.brutuspolus.com, o utilizador terá acesso, na página inicial ("Home"), às ofertas de parceiros que temos disponíveis no momento (atualizadas conforme necessário). Também terá acesso às nossas ferramentas de "Blackjack" e "Glossário". Em "Blackjack" existe acesso a um resumo da história do Blackjack e também um quadro de blackjack que poderá ser uma funcionalidade útil para o utilizador. Em "Glossário" explicamos todas as expressões usadas no stream e casino em caso de dúvidas. Além das ferramentas, também damos acesso a um Leaderboard, onde os utilizadores poderão aceder mensalmente aos rankings de WAGER dos utilizadores afiliados no casino parceiro BC.Game. Este ranking também é premiado mensalmente entre os primeiros 5 utilizadores com maior Wager. Os "mini jogos" disponíveis no site em "Jogar" são para os utilizadores poderem apostar os seus pontos virtuais, obtendo assim ganhos virtuais ou não para comprar presentes na loja disponível. A "Loja" é um conjunto de produtos virtuais oferecidos pelo BrutusPolus que podem ser comprados através de pontos virtuais ao assistir streams e participar em jogos. A loja oferece produtos como depósitos de casino, torneios, produtos eletrónicos, etc.`,
  },
  {
    title: "8. Dados de Fontes de Terceiros",
    content: `Podemos obter informações adicionais de fontes terceiras, como anunciantes, jogos ou serviços que usa, ou redes sociais (como Discord, Twitch) aos quais o nosso acesso foi aprovado. Quando acede aos nossos serviços através de redes sociais, ou quando conecta os nossos serviços às redes sociais, está a autorizar o BrutusPolus a recolher, armazenar e usar esta informação e conteúdo adicional de acordo com a política de privacidade. Usamos esta informação para complementar a informação que recolhemos sobre o utilizador de forma a fornecer experiências mais relevantes e seguras para o utilizador e melhorar os nossos serviços, análises e publicidade.`,
  },
  {
    title: "9. Quem Pode Usar o Site",
    content: `Ao aceder ao website, o utilizador ou convidado, que é uma pessoa singular, confirma ter pelo menos 18 anos de idade e ter plena capacidade legal. O acesso ao website é proibido para pessoas menores de 18 anos ou menores da idade à qual o "jogo" é proibido no caso do utilizador. É da responsabilidade exclusiva do utilizador determinar se está autorizado a "jogar" online na sua jurisdição, bem como verificar quaisquer outros requisitos legais em vigor.\n\nPara usar o site, o utilizador deve ser: maior de 18 anos ou maior que a idade legal para "jogar" no país a partir do qual está a jogar; uma pessoa real. Não pode ser uma empresa ou outras entidades legais; Uma pessoa que utiliza um endereço, um número de telefone e/ou um endereço IP.`,
  },
  {
    title: "10. Como Pode Usar o Website",
    content: `10.1.1 Clique no botão "Login".\n10.1.2 Inicie sessão com os seus dados, por exemplo, Twitch.tv; Clique no botão "Iniciar Sessão com a Conta Twitch".\n10.1.3 Será redirecionado para o Twitch.tv, onde terá de iniciar sessão com o seu nome de utilizador e password do Twitch.tv.\n10.1.4 Após iniciar sessão na sua conta Twitch.tv, clique em "Autorizar" para se conectar ao BrutusPolus.\n10.1.5 Será então redirecionado para o BrutusPolus e iniciará sessão com as suas informações do Twitch.TV.\n\n10.2 Giveaways e Loja\n10.2.1 O BrutusPolus facilitará e promoverá giveaways e prémios do BrutusPolus e/ou patrocinados por casinos afiliados nas páginas "Loja" e "Home" do nosso website com o único propósito de mostrar gratidão e recompensar os nossos utilizadores fiéis.\n10.2.2 Os termos e condições para giveaways podem ser encontrados aqui.\n10.2.3 Todos os itens/ofertas patrocinados na loja estão sujeitos aos termos e condições do casino que patrocina o item/oferta.\n10.2.4 Itens patrocinados oferecidos na loja podem ser de natureza pecuniária ou não pecuniária.\n10.2.5 Qualquer entrada em giveaway está disponível apenas uma vez por pessoa, conta de utilizador, família, habitação, endereço, endereço de email, computador/dispositivo e/ou endereço IP.`,
  },
  {
    title: "11. Condições Gerais para o Utilizador",
    content: `11.1 O utilizador deve registar-se e usar este website apenas em seu nome e não em nome de qualquer outra pessoa.\n\n11.2 Deve manter os seus dados de início de sessão (nome, password ou outras credenciais) em segurança e não os partilhar com ninguém. Se os partilhar, mesmo que não intencionalmente, será responsável por qualquer abuso indevido ou uso da sua conta. Não aceitamos qualquer responsabilidade por qualquer perda e/ou informação perdida devido a uso não autorizado da sua conta resultante de uso incorreto dos seus dados de início de sessão. É da responsabilidade do utilizador garantir que mantém os seus dados confidenciais e é sua responsabilidade proteger qualquer endereço de e-mail, computador pessoal ou outro dispositivo no qual a sua conta de utilizador esteja acessível. O utilizador é totalmente responsável por qualquer uso indevido dos seus dados de início de sessão ou dispositivos. Se o utilizador estiver preocupado com o facto de as suas credenciais terem sido divulgadas a terceiros, deve notificar imediatamente o suporte para que possamos fornecer-lhe uma nova password. Salvo se causado por negligência da nossa parte, qualquer uso não autorizado dos seus dados de sessão e qualquer uso não autorizado da sua conta são da exclusiva responsabilidade do utilizador e serão considerados como uso próprio.\n\n11.3 Se verificar que a informação fornecida no momento do registo ou da sua conta está incorreta, deve informar-nos imediatamente ou alterar imediatamente as suas informações.\n\n11.4 É da responsabilidade do utilizador saber se a sua atividade no website é legal no país ou território a partir do qual está a aceder ao website.\n\n11.5 Apenas uma conta para os dados pessoais reais do utilizador é permitida. A abertura de conta só é permitida para uma pessoa usando um endereço e um endereço IP. Quaisquer outras contas abertas no website serão consideradas como "contas duplicadas". Neste caso, o BrutusPolus reserva-se o direito de fechar todas as contas duplicadas e aplicar as seguintes sanções: Cada ação realizada usando uma conta duplicada é considerada nula, e reservamo-nos o direito de fechar todas as contas duplicadas, e/ou banir ou excluir a conta original do utilizador por mau uso deste website.\n\n11.6 Se, durante o período de atividade de uma conta duplicada, produtos da loja foram obtidos a partir da conta duplicada, serão anulados e o BrutusPolus reserva-se o direito de retirar o prémio e solicitar a devolução desses bens.\n\n11.7 O BrutusPolus reserva-se o direito de cancelar a participação em qualquer promoção, bem como de banir permanentemente qualquer utilizador do website. Também nos reservamos o direito de encerrar uma conta existente sem qualquer aviso por escrito ou qualquer explicação.\n\n11.8 Não é permitido transferir ou receber fundos de uma conta para outra e/ou transferir, vender ou comprar outras contas.\n\n11.9 Não pode usar qualquer erro técnico ou vulnerabilidade para seu benefício. Teremos o direito de cancelar e reclamar todos os prémios obtidos desta forma.\n\n11.10 O utilizador não se envolverá em qualquer atividade fraudulenta, de conluio, fixação ou outra atividade ilegal em relação ao seu uso do website (ou terceiros). Não usará quaisquer métodos ou técnicas assistidos por software ou dispositivos de hardware para auxiliar a sua participação em jogos, giveaways e/ou loja no website.\n\n11.11 O utilizador concorda que podemos também partilhar a sua informação com outras pessoas ou empresas, de acordo com a nossa política de privacidade, para realizar a nossa atividade e fornecer o website ao utilizador.`,
  },
  {
    title: "12. O Que Podemos Fazer",
    content: `12.1 Podemos recusar a abertura de uma conta por qualquer motivo.\n\n12.2 Podemos suspender ou terminar a conta do utilizador por qualquer violação ou suspeita de violação deste contrato ou qualquer outro motivo válido.\n\n12.3 Se tentar abrir uma conta diferente da sua primeira conta, bloquearemos ou fecharemos a conta. Também podemos bloquear ou encerrar a sua primeira conta.\n\n12.5 Podemos partilhar a sua informação pessoal com outras pessoas ou empresas, de acordo com a nossa Política de Privacidade e conforme acordado pelo seu uso do nosso website.\n\n12.6 Deve notar-se que, se o utilizador estiver a usar o website de uma forma que não se destine a ser informativa, divertida e recreativa, reservamo-nos o direito de banir ou eliminar a sua conta, remover quaisquer ganhos pecuniários ou não pecuniários obtidos com esta atividade, e a conta pode ser permanentemente encerrada.\n\n12.7 Declaramos a entrada numa atividade ou a sua transação na loja como totalmente nula (e/ou encerrar a sua conta) se acreditarmos que qualquer uma das seguintes situações se aplica: o utilizador ou pessoas associadas ao utilizador podem ter influenciado direta ou indiretamente o resultado de um evento; O utilizador ou pessoas associadas ao utilizador podem ter acesso a conhecimento privilegiado que pode influenciar o resultado de um evento; O utilizador ou pessoas associadas ao utilizador ignoram direta ou indiretamente os termos; O resultado de um evento foi direta ou indiretamente afetado por atividade criminosa; Houve uma mudança significativa nas probabilidades, por exemplo, devido a um anúncio público sobre um evento; Giveaway ou loja foi aceite que não teríamos aceite, devido a um problema técnico que afetou o website nesse momento ou um erro, má impressão e/ou qualquer coisa fora do nosso controlo.\n\n12.8 Se suspeitarmos que o utilizador está envolvido em atividades ilegais ou fraudulentas relacionadas com o seu uso do website (ou usando o website por terceiros) ou que está envolvido em qualquer outro comportamento prejudicial ao website, podemos congelar ou encerrar a sua conta sem qualquer aviso.`,
  },
  {
    title: "13. Encerrar a Sua Conta",
    content: `13.1 Pode encerrar a sua conta a qualquer momento, contactando o suporte diretamente através do nosso "Contacto" no fundo do website BrutusPolus.\n\n13.2 Quando encerrar a sua conta: o utilizador deve contactar o suporte e solicitar especificamente o encerramento da sua conta.\n\n13.3 Se estiver a encerrar a sua conta porque tem um problema de dependência de jogo, veja a secção 15 destes termos.\n\n13.4 Se a sua conta foi encerrada por nós devido a uma violação destes termos, reservamo-nos o direito de recusar a reativação da sua conta.\n\n13.5 Se a conta do utilizador for encerrada pelo utilizador ou por nós, e o utilizador tiver ganhos pecuniários ou não pecuniários pendentes que não foram reclamados pelo utilizador, reservamo-nos o direito de remover esses ganhos e não os atribuir ao utilizador. Se a conta do utilizador foi encerrada devido a uma violação destes termos, reservamo-nos o direito de retirar todos e quaisquer ganhos e não os atribuir ao utilizador.`,
  },
  {
    title: "14. Links para os Websites dos Nossos Afiliados e Parceiros",
    content: `Fazemos todos os esforços para lhe fornecer ligações para os melhores websites na internet; Os melhores em termos de oferta, qualidade e segurança. Como mencionado anteriormente, certifique-se de que lê as condições de uso de cada site, uma vez que a nossa política de privacidade não se estende aos nossos websites afiliados e parceiros. Tenha também em mente que o BrutusPolus trabalha com casinos internacionais, pelo que é da responsabilidade do utilizador reconhecer se está autorizado a aceder a tais sites.\n\n14.1 Direitos do Utilizador\nO utilizador reserva os seguintes direitos em relação aos seus dados: direito de acesso. Pode pedir-nos para lhe fornecer os seus dados pessoais que mantemos no nosso armazenamento seguro. Pode pedir-nos para apagar, modificar ou atualizar os dados. Se, por razões legais, formos obrigados a recusar o seu pedido, fornecer-lhe-emos uma referência e explicação para o facto. Direito de correção — Se algum detalhe dos seus dados não estiver correto, pode pedir-nos para atualizar os dados. Direito de apagar — Com base no seu pedido, apagaremos os seus dados completa e irrevogavelmente; Após isso, não poderá usar o nosso website. Contacte o suporte para solicitar a remoção da sua conta e eliminar os seus dados. Os nossos representantes de suporte receberão a ordem e apagarão completamente a sua conta e todos os vestígios que deixou no BrutusPolus.`,
  },
  {
    title: "15. Jogo Responsável",
    content: `15.1 O jogo pode ser viciante. Se precisar de ajuda para superar esta dependência, siga esta ligação (https://www.begambleaware.org) que o redirecionará para uma página de jogo responsável. Sem vergonha, sem julgamento, apenas ajuda.\n\n15.2 Faça um teste de autoavaliação. Se está preocupado sobre se tem um problema de jogo ou se pensa que já tem um problema de jogo, tente o teste de autoavaliação oferecido pelo website Be Gamble Aware. Se estiver preocupado com o resultado do teste, considere a possibilidade de eliminar a sua conta contactando o suporte. Pode sempre aceder à ajuda do website Be Gamble Aware, que pode ser encontrado em https://www.begambleaware.org.\n\nOnde posso encontrar ajuda?\nSe é viciado em apostas (sejam desportivas ou casino) pode contactar o instituto de apoio ao jogador com o seguinte número: (+351) 968230998. Em outras situações, pode também contactar diretamente o 112.`,
  },
  {
    title: "16. Como Submeter uma Reclamação",
    content: `16.1 Se tiver alguma reclamação sobre o(s) serviço(s) fornecido(s) neste website, contacte o departamento de suporte, enviando um email para expor a situação a ser tratada. Pode ter acesso ao email em "Contacto". O nosso objetivo é responder a todos os pedidos dentro de 10 dias úteis após a receção da sua comunicação. Se a natureza do pedido de informação requerer mais tempo para a sua conclusão, este período pode ser estendido por mais dez dias. O Utilizador será informado nos primeiros dez dias a partir da data de receção da reclamação, se este período tiver de ser estendido.\n\n16.2 De forma a tratar a sua reclamação de forma rápida e eficiente, forneça-nos informação clara sobre a sua identidade, bem como todos os detalhes relevantes que deram origem ao problema. Faremos todos os esforços para resolver prontamente a questão comunicada e chegar a um acordo amigável.\n\n16.3 Qualquer reclamação que o utilizador possa ter em relação a ofertas de parceiros deve ser apresentada dentro de 7 dias após os resultados finais da oferta (por exemplo, se o utilizador tiver uma reclamação sobre a entrada num giveaway ou uma reclamação sobre os resultados de um minijogo). Caso contrário, não consideramos a reclamação válida.`,
  },
  {
    title: "17. Política de Privacidade",
    content: `Pode ler a nossa Política de Privacidade aqui. O utilizador deve estar ciente de que a aceitação dos termos inclui a aceitação total dos termos da nossa política de privacidade. Portanto, pedimos-lhe que leia a Política de Privacidade cuidadosamente.`,
  },
  {
    title: "18. Responsabilidade do Utilizador para Connosco",
    content: `18.1 O utilizador acede ao website e participa por sua conta e risco. O website é fornecido "tal como está". As únicas promessas que fazemos sobre o website estão descritas nestes termos. Não garantimos (em linguagem simples, não prometemos legalmente) que: o software ou website é adequado para o objetivo e está livre de erros; O website estará acessível sem interrupções.\n\n18.2 Não seremos responsáveis por nada, o que inclui quaisquer perdas, custos, despesas ou danos, sejam diretos, indiretos, especiais, consequentes, incidentais ou de outra forma resultantes do seu uso do website.\n\n18.3 O Utilizador concorda em compensar-nos totalmente (em linguagem simples, compensar-nos por qualquer perda) e diretores, empregados, parceiros e prestadores de serviços por qualquer custo, despesa, perda, danos, reclamações e responsabilidades, independentemente da causa que possa surgir relativamente ao seu uso do site ou participação nos jogos. Se não concordar com isto, não deve usar o website.`,
  },
  {
    title: "19. Violações, Penalidades e Cessação",
    content: `19.1 Se suspeitarmos que o utilizador violou estes termos, podemos recusar a abertura, suspender ou encerrar a conta do utilizador.\n\n19.2 Também temos o direito de proibir ou encerrar a conta do utilizador se: suspeitarmos que o utilizador está envolvido em atividades ilegais ou fraudulentas; Acreditarmos que o utilizador abusou do site; O utilizador estiver a violar qualquer um dos termos contidos aqui no nosso website.\n\n19.3 A nossa decisão é definitiva.`,
  },
  {
    title: "20. Propriedade Intelectual",
    content: `20.1 https://www.brutuspolus.com ou qualquer outro subdomínio é o nosso localizador uniforme de recursos e nenhum uso não autorizado deste URL pode ser feito em qualquer outro website ou plataforma digital sem o nosso consentimento prévio por escrito. Hiperligações para o website e quaisquer das suas páginas não podem ser incluídas em qualquer outro website sem o nosso consentimento prévio por escrito.\n\n20.2 Somos o proprietário ou o legítimo detentor dos direitos da tecnologia, software e sistemas usados no website.\n\n20.3 O utilizador concorda em não usar qualquer dispositivo automático ou manual para monitorizar as nossas páginas web ou qualquer conteúdo. Qualquer uso ou reprodução não autorizado pode ser objeto de ação legal.`,
  },
  {
    title: "21. Divisibilidade",
    content: `Se qualquer disposição destas condições for considerada ilegal ou inaplicável, essa disposição será separada destas condições e todas as outras disposições permanecerão em vigor sem serem afetadas por esta separação.`,
  },
  {
    title: "22. Acordo Integral e Admissibilidade",
    content: `22.1 As condições constituem o acordo completo entre nós em relação a este website e, exceto em caso de fraude, anulam todas as comunicações e propostas anteriores, sejam eletrónicas, orais ou escritas, entre nós.\n\n22.2 Uma versão impressa destas condições e qualquer notificação feita em formato eletrónico será admissível em procedimentos legais ou administrativos.`,
  },
  {
    title: "23. Cessão",
    content: `Podemos ceder ou transferir este acordo. O utilizador não pode ceder ou transferir este acordo.`,
  },
  {
    title: "24. Contacto",
    content: `Para qualquer pedido ou dúvida: envolvendo o esclarecimento ou problema de qualquer questão relacionada com estes termos e condições e/ou o site, ou um problema com os sites de casino que promovemos, pode contactar-nos pelo seguinte email: support@brutuspolus.com. Para qualquer questão envolvendo marketing e/ou interesse em colaboração, poderá usar o mesmo email.`,
  },
  {
    title: "25. Uso Proibido da Conta",
    content: `25.1.1 Proibição de Bot/Inteligência Artificial. O utilizador não pode usar software de Bot ou inteligência artificial, obtido comercialmente ou desenvolvido de forma privada, ao jogar ou usar o website. "Bots" são programas de software ou outros dispositivos que interferem com o software de jogo e/ou o nosso website. Bots podem usar termos ou inteligência artificial para tomar decisões de jogo ou alterar o nosso website sem o nosso consentimento. Procuraremos ativamente este tipo de software de acordo com estes termos. O consentimento para estes Termos também estabelece que o utilizador não interferirá com qualquer um dos mecanismos de deteção. Esta cláusula aplica-se independentemente de o bot ser efetivamente usado em conjunto com jogos ou não.\n\n25.1.2 Outros tipos de software proibido incluem, mas não se limitam a, software que: dá ao utilizador qualquer tipo de vantagem injusta; Partilha lacunas com utilizadores ou convidados, ou auxilia o conluio de qualquer forma; Usa uma base de dados de perfis de utilizador que é partilhada entre utilizadores; Reduz ou elimina a necessidade de um ser humano tomar decisões; É projetado para Datamine (por exemplo: recolher informação sobre os perfis de utilizador do site além do que observou do seu perfil de utilizador) para qualquer propósito, seja pessoal ou comercial. Isto também se aplica a quaisquer dados obtidos por datamining. Além disso, é proibido partilhar quaisquer dados legitimamente recolhidos com outros utilizadores; Tenta bloquear qualquer um dos nossos mecanismos de deteção de abuso.\n\n25.1.3 Proibição de Conluio. É proibido aos utilizadores agirem como equipa, com ou sem acordo explícito prévio, em detrimento real ou possível de outros utilizadores do website. O utilizador deve: não trabalhar em conjunto com outro utilizador para obter uma vantagem; Não partilhar informação pessoal com qualquer outro utilizador; Não encorajar qualquer outro utilizador ao conluio.\n\n25.1.4 Proibição de Partilha de Conta. Os utilizadores não devem partilhar a sua conta sob quaisquer circunstâncias com qualquer outra pessoa, uma vez que tal equivaleria a "abuso de múltiplas contas". Portanto, é proibido a qualquer utilizador obter uma vantagem ao partilhar uma conta com qualquer pessoa. Um utilizador não pode usar qualquer conta que não seja a sua e deve manter as suas credenciais (pseudónimo, password e qualquer outra informação usada para aceder à conta de utilizador) e não as revelar a ninguém.\n\n25.1.5 Proibição de Vantagens Injustas. Qualquer tentativa de obter uma vantagem injusta sobre outros utilizadores é estritamente proibida, seja especificamente proibida pelas condições ou não. Qualquer atividade destinada a dar a um utilizador uma vantagem injusta, mas que possa ser permitida sob uma interpretação estrita das condições, devido a uma lacuna ou a características de software não intencionais, continua a ser proibida.\n\n25.1.6 Proibição de Jogadores Problemáticos. Qualquer pessoa com problemas de jogo está proibida de registar uma conta sob quaisquer circunstâncias. Se um utilizador descobrir que tem um problema de jogo, é obrigado a informar-nos e a parar de jogar imediatamente.\n\n25.1.7 A conta do utilizador pode ser bloqueada/encerrada sem aviso — temos o direito de bloquear e/ou encerrar permanentemente a conta do utilizador a nosso critério e sem aviso. Isto é feito para parar o uso da conta enquanto o BrutusPolus conduz investigações e por qualquer outro motivo que consideremos apropriado. O BrutusPolus não é responsável por informação incorreta sobre bónus, ofertas ou promoções listadas no site. O BrutusPolus recomenda que o utilizador reveja todos os termos e condições de todos os bónus listados nos websites dos casinos parceiros.`,
  },
];

export function TermsAndConditions() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <ScrollReveal>
          <SectionHeading
            title="Termos & Condições"
            subtitle="Leia atentamente antes de utilizar o website"
          />
        </ScrollReveal>

        <div className="mt-10 space-y-8">
          {sections.map((section, i) => (
            <ScrollReveal key={i}>
              <div className="bg-arena-charcoal/60 rounded-xl border border-arena-steel/20 p-6 sm:p-8">
                <h2 className="gladiator-label text-arena-gold text-lg font-bold mb-4">
                  {section.title}
                </h2>
                <div className="text-arena-smoke text-sm leading-relaxed whitespace-pre-line">
                  {section.content}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal>
          <div className="mt-12 text-center text-arena-ash text-xs">
            <p>Última atualização: 03 de julho de 2024</p>
            <p className="mt-1">
              Para questões contacte{" "}
              <a
                href="mailto:support@brutuspolus.com"
                className="text-arena-gold hover:underline"
              >
                support@brutuspolus.com
              </a>
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
