"use client";

import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const sections = [
  {
    title: "O que são cookies?",
    content: `Como é prática comum em quase todos os websites profissionais, este site usa cookies, que são pequenos ficheiros descarregados para o seu computador, para melhorar a sua experiência. Esta página descreve que informação recolhem, como a usamos, e porque precisamos por vezes de armazenar estes cookies. Também partilharemos como pode impedir que estes cookies sejam armazenados, embora isso possa afetar a funcionalidade de certos elementos do site.`,
  },
  {
    title: "Como usamos cookies?",
    content: `Usamos cookies por várias razões, detalhadas abaixo. Infelizmente, na maioria dos casos, não existem opções padrão da indústria para desativar cookies sem desativar a funcionalidade e as características que adicionam a este site. É recomendado que deixe todos os cookies se não tiver a certeza se precisa deles ou não, pois são usados para fornecer um serviço que utiliza.`,
  },
  {
    title: "Desativar cookies",
    content: `Pode impedir a definição de cookies ajustando as configurações no seu browser (consulte a secção "Ajuda" do browser para instruções sobre como fazê-lo). Esteja ciente de que desativar cookies afetará a funcionalidade deste e de muitos outros websites que visita. Desativar cookies geralmente resulta na desativação de certas funcionalidades e características deste site. Portanto, é recomendado que não desative cookies.`,
  },
  {
    title: "Cookies relacionados com a conta",
    content: `Se criar uma conta connosco, usamos cookies para gerir o processo de registo e administração geral. Estes cookies serão geralmente removidos quando encerrar sessão no sistema, mas em alguns casos, podem permanecer depois para lembrar preferências do site quando sai.`,
  },
  {
    title: "Cookies de login",
    content: `Usamos cookies para lembrar o seu estado de login para que não tenha de iniciar sessão toda vez que visita uma nova página. Estes cookies são tipicamente removidos ou limpos quando encerra sessão para garantir que só pode aceder a recursos e áreas restritas quando está com sessão iniciada.`,
  },
  {
    title: "Cookies relacionados com promoções",
    content: `Este site oferece serviços de subscrição para informação promocional ou email, e cookies podem ser usados para lembrar se já está registado e se devem ser mostradas certas notificações válidas apenas para utilizadores registados/não registados.`,
  },
  {
    title: "Cookies relacionados com inquéritos",
    content: `Periodicamente, oferecemos inquéritos e questionários para fornecer informações interessantes, ferramentas úteis, ou para compreender a nossa base de utilizadores com mais precisão. Estes inquéritos podem usar cookies para lembrar quem já participou num inquérito ou para fornecer resultados precisos após mudanças de página.`,
  },
  {
    title: "Cookies relacionados com formulários",
    content: `Quando dados são submetidos através de um formulário como os encontrados em páginas de contacto ou formulários de comentários, cookies podem ser definidos para lembrar detalhes do utilizador para correspondência futura.`,
  },
  {
    title: "Cookies de preferências do site",
    content: `Para fornecer uma ótima experiência neste site, disponibilizamos a funcionalidade de definir preferências sobre como este site funciona quando é usado. Para lembrar estas preferências, precisamos de definir cookies para que esta informação possa ser chamada sempre que ocorre uma interação quando uma página é afetada por estas preferências.`,
  },
  {
    title: "Compromisso do Utilizador",
    content: `O utilizador compromete-se a usar o conteúdo e a informação fornecida pelo BrutusPolus no site de forma apropriada e com os seguintes compromissos, mas não limitados a:\n\nA) Não praticar atividades que sejam ilegais ou contrárias à boa-fé e à ordem pública;\n\nB) Não disseminar propaganda ou conteúdo de natureza racista, xenófoba, ou relacionado com jogo ilegal, pornografia ilegal, apologia ao terrorismo, ou contra os direitos humanos;\n\nC) Não causar danos aos sistemas físicos (hardware) e lógicos (software) do BrutusPolus, dos seus fornecedores, ou de terceiros, através da introdução ou disseminação de vírus informáticos ou quaisquer outros sistemas de hardware ou software capazes de causar os danos supramencionados.`,
  },
  {
    title: "Bloquear cookies",
    content: `O utilizador pode bloquear e/ou desativar cookies de qualquer site, incluindo o nosso, a qualquer momento. Para tal, aceda às definições do seu browser. Veja abaixo guias de ajuda para os principais browsers:\n\n• Google Chrome\n• Firefox\n• Microsoft Edge\n• Opera\n• Safari`,
  },
  {
    title: "Mais informações",
    content: `Esperamos que isto tenha esclarecido as coisas para si e, como mencionado anteriormente, se não tiver a certeza se precisa ou não de um cookie, é geralmente mais seguro deixar os cookies ativados caso interaja com uma das funcionalidades que usa no nosso site.`,
  },
];

export function CookiePolicy() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <ScrollReveal>
          <SectionHeading
            title="Política de Cookies"
            subtitle="Como usamos cookies para melhorar a sua experiência"
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
                href="mailto:info@brutuspolus.com"
                className="text-arena-gold hover:underline"
              >
                info@brutuspolus.com
              </a>
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
