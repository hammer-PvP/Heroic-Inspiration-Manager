# Heroic Inspiration Manager

**[English guide](README.md) · [Histórico de versões](CHANGELOG.md) · [Reportar problemas](https://github.com/hammer-PvP/Heroic-Inspiration-Manager/issues)**

## Uma inspiração que o Mestre pode administrar — sem substituir as regras do D&D5e

O **Heroic Inspiration Manager (HIM)** é um módulo para Foundry VTT e D&D5e que transforma a Inspiração Heroica em um recurso administrável, verificável e utilizável pela ficha nativa. Em vez de criar um segundo contador escondido, o módulo cria um **Item de Equipamento/Trinket gerenciado** no personagem. As cargas desse Item, armazenadas em **Item Uses** do próprio D&D5e, são a fonte de verdade.

O objetivo não é redefinir quando um personagem *merece* Inspiração Heroica. Isso continua sendo uma decisão das regras e do GM. O HIM resolve a parte operacional: **conceder, acumular, gastar, recuperar, acompanhar e apresentar o recurso de maneira consistente**, inclusive quando muitos personagens participam da mesma mesa.

### Filosofia de design

- **Uma fonte de verdade.** A estrela de Inspiração da ficha e a Utility Activity do Item consultam o mesmo saldo, evitando dois contadores independentes.
- **O GM define a política.** Limite, custo por uso, recuperação, sintonização e concessão de cargas são configuráveis; o módulo não impõe um estilo único de campanha.
- **Usar o nativo quando possível.** As cargas e o consumo usam documentos e Activities do D&D5e, em vez de simular um inventário paralelo.
- **Compatibilidade sem privilégios ocultos.** A proteção do Item deve conviver com importadores, construtores de personagem e outras automações. Nenhum módulo externo recebe autoridade de GM apenas por declarar seu nome numa opção da API.
- **Efeitos são opcionais.** Som e animação celebram a concessão, mas não alteram a regra, o custo ou o sucesso da operação.
- **Integridade acima de conveniência.** Operações de terceiros que recriam Items devem preservar IDs, cargas e estados. O HIM não promete que um módulo externo fará isso automaticamente.

## Os problemas que o módulo resolve

| Situação na mesa | Solução do HIM |
| --- | --- |
| O GM precisa anotar cargas para vários personagens | **Manager** para conceder, revogar e definir saldos, individualmente ou em lote |
| Personagens acumulam mais de uma Inspiração | **Máximo fixo configurável** ou acumulação sem teto configurado; cada uso ainda consome cargas |
| A estrela da ficha e o recurso do personagem ficam fora de sincronia | A estrela funciona como atalho para a **Activity do Item gerenciado** |
| O jogador precisa declarar o uso sem editar o saldo | **Utility Activity** nativa, com consumo configurável e anúncio no Chat |
| O GM quer conceder o recurso por grupos | Filtros de Actor, pasta, Group nativo, nome e operações em lote |
| Um recurso de espécie concede Inspiração após Long Rest | Reconhecimento por `system.identifier` estruturado (padrão: `resourceful`) |
| O GM deseja identidade visual para a recompensa | Som opcional, Token Magic FX ou Sequencer + JB2A Free, incluindo efeitos por classe |
| Importadores ou Level Up reconstroem o inventário | **Sheet Only** evita vetar globalmente exclusões programáticas, com compromisso de segurança documentado |

## Instalação e requisitos

Instale pelo gerenciador de módulos do Foundry usando o manifesto estável:

`https://github.com/hammer-PvP/Heroic-Inspiration-Manager/releases/latest/download/module.json`

Ative o módulo no mundo D&D5e. A compatibilidade declarada no manifesto cobre **Foundry VTT 13.351–14.369** e **D&D5e 5.2.5–6.0.6**; a validação de cada integração deve ser feita no mundo onde ela será utilizada. O HIM não exige Character Builder, Plutonium, Sequencer ou Token Magic FX para suas funções principais.

Opcionalmente instale **Token Magic FX** *ou* **Sequencer + JB2A – Free Content** para animações. O módulo não distribui arquivos da biblioteca JB2A.

## Guia rápido para o GM

1. Abra **Configurações → Heroic Inspiration → Settings**. Defina o nome e ícone do Item, limite de cargas, custo, exigência de sintonização e recuperação no Descanso Longo.
2. Em **Editing restrictions**, mantenha a proteção de edição de Players e escolha o modo de exclusão: **Sheet Only** (compatibilidade, padrão) ou **Strict** (bloqueio mais rígido).
3. Opcionalmente configure som e FX de concessão, incluindo navegador JB2A, efeitos globais e ajustes por classe.
4. Use **Save and create/sync items** para criar Items gerenciados ausentes e ajustar configurações sem zerar os saldos existentes. A sincronização é feita nos Actors elegíveis do mundo.
5. Abra o **Heroic Inspiration Manager** no diretório de Actors, acima da pesquisa, ou pelo atalho das Settings.
6. Filtre os Actors, selecione os personagens e use **Apply Item**, **Grant**, **Revoke** ou **Set Exact**. Este último é especialmente útil na migração de saldos antigos.

**Escopo do Manager.** Nas Settings, o **Manager Actor Source** pode ser *All*, uma pasta do diretório (com subpastas opcionais) ou um Group nativo. Esse escopo restringe a grade do Manager; **não restringe o botão global de criar/sincronizar Items**. Os filtros dentro da grade continuam funcionando sobre os Actors visíveis, e a seleção é limpa quando os filtros mudam.

## Guia para os jogadores

O personagem recebe um Item chamado **Heroic Inspiration** (ou o nome configurado pelo GM). O Item deve estar equipado e, se exigido na campanha, sintonizado para ser usado. Há duas maneiras equivalentes de gastar o recurso:

- Clicar na **estrela de Inspiração** na ficha de personagem.
- Usar a **Utility Activity** do Item no inventário.

Ambos utilizam as cargas do mesmo Item. O custo por utilização é configurado pelo GM. O jogador não precisa modificar `Item Uses` manualmente, e o módulo não faz automaticamente uma nova rolagem ou aplica vantagem por conta própria: o anúncio ocorre no Chat e a mesa segue sua regra normal de Inspiração.

### Cargas e recuperação

No modo **Fixed**, o GM escolhe um máximo. No modo **Unlimited accumulation**, não há um teto fixo para novas concessões, **mas cada uso continua gastando cargas** — não é Inspiração infinita gratuita. Recuperação nativa em Descanso Longo pode ser desativada, total ou por fórmula.

Separadamente, personagens que possuam um Item com `system.identifier` correspondente à configuração de **Long Rest feature identifiers** (padrão `resourceful`) recebem uma carga de Inspiração por Descanso Longo, respeitando o limite. Isso não depende de nome de espécie nem de descrição textual; para o processamento feito pelo jogador, é necessário um GM online.

## Proteção, compatibilidade e segurança

A configuração **Block players from editing managed charges and properties** protege os valores do Item contra edição direta. O estado de **equipped** e **attuned** pode ser alterado pelo jogador de acordo com a configuração de combate. A **exigência** de sintonização, por outro lado, é uma propriedade definida pelo GM, não um campo livre do jogador.

### Item deletion protection

| Modo | Como funciona | Compromisso |
| --- | --- | --- |
| **Sheet Only (padrão)** | Oculta/intercepta exclusão nas fichas nativas D&D5e, mas não veta globalmente `deleteEmbeddedDocuments` quando a operação é iniciada por um Player | Também permite exclusões feitas pelo próprio Player via macro, console ou interfaces não cobertas |
| **Strict** | Impede exclusão do Item gerenciado em operações iniciadas pelo Player, inclusive scripts | Pode interferir em importadores, Level Up e outros processos que recriam inventários |

O controle **Allow GM direct editing** continua independente do modo de exclusão. A proteção de **edição direta de cargas e propriedades** para Players também continua independente da escolha acima. Atualizações que não mudam valores efetivos não devem ser interpretadas como adulterações. Metadados de ordenação e flags pertencentes a outros módulos podem coexistir com o Item, sem permitir que modifiquem a flag de gerenciamento do HIM.

**Importante:** *Sheet Only* é uma proteção de **interface**, não um mecanismo de autorização no servidor. É apropriado para mesas confiáveis que priorizam interoperabilidade. Interfaces personalizadas de terceiros podem exigir proteção adicional. Nenhuma opção passada por outro módulo — por exemplo, `characterBuilderLevelUp: true` — concede permissão especial no HIM.

### Recomendações para outros módulos (Character Builder, Plutonium e demais)

- **Prefira alterações diferenciais.** Não exclua e recrie todos os Items se alguns deles não mudaram.
- **Preserve os identificadores e estados.** Quando reconstruir um Item gerenciado, conserve seu `_id`, flags de gerenciamento, `system.uses`, Equipped, Attuned e Activities; não crie um documento com ID que ainda exista no Actor.
- **Trate rollback como parte da operação.** Capture um snapshot antes de mudar o Actor, valide o resultado e restaure com segurança em caso de erro.
- **Evite tocar em campos do HIM sem necessidade.** Atualizações em campos protegidos continuam sujeitas ao controle normal; o modo Sheet Only não libera edição de cargas por scripts.
- **Não confunda compatibilidade com transação atômica.** O HIM não garante a integridade de imports, Drafts ou rollbacks de terceiros. Se o módulo externo faz uma reconstrução perigosa, ele também precisa corrigi-la.

A API pública, apenas para consulta, fica em `game.modules.get("heroic-inspiration-manager").api` e oferece `getItem(actor)`, `getCharges(actor)` e `openManager()`. Não existe API pública para alterar saldo arbitrariamente como Player.

## Som e efeitos visuais opcionais

O GM pode selecionar um áudio de concessão independente das animações. Para FX, escolha somente um motor: **None**, **Token Magic FX** ou **Sequencer + JB2A Free**. Os FX ocorrem em concessões bem-sucedidas efetuadas pelo GM; uma falha na animação não desfaz a concessão.

Com Sequencer e JB2A Free instalados, o botão **Browse** abre um navegador que pesquisa os paths `jb2a.*` realmente registrados na Database. Ele oferece **Category, Color, Shape, Variation e Distance**, todos inicialmente em **All**, busca textual completa, páginas de 100 efeitos, navegação direta e **preview animado dentro da janela**. **Confirm** escolhe o path e **Cancel** preserva o valor anterior; o salvamento definitivo ocorre ao salvar as Settings.

O FX global é o fallback. Há overrides opcionais para as 12 classes, numa seção recolhida por padrão. Em multiclasses, **Efx from : Highest Class Level** (padrão) ou **Starting Class** escolhe uma única classe; caso não haja efeito válido para ela, aplica-se o Global. O botão **Test FX** reproduz o efeito num Token selecionado, sem conceder cargas. Isso é distinto da prévia local do navegador, que não executa efeitos no Canvas.

## Diagnóstico e boas práticas

- **O Item não aparece:** peça ao GM que execute **Save and create/sync items**; Items comuns com nome igual não são substituídos silenciosamente.
- **A estrela não consome:** verifique se o Item está equipado, sintonizado quando necessário e se há cargas suficientes.
- **Uma feature não concede após o Long Rest:** confira o `system.identifier` real do Item da feature, a configuração de identificadores e se há um GM online.
- **FX JB2A não aparece:** confirme Sequencer e JB2A Free ativos, selecione um `jb2a.*` disponível e teste com um Token selecionado.
- **Um importador ou Level Up falhou com `_id already exists`:** isso pode indicar tentativa de recriar um Item que não foi removido. Confira o modo de proteção e o fluxo transacional do outro módulo; não apague backups nem remova travas de segurança de terceiros sem verificar a integridade do Actor.
- **Antes de atualizações de módulos:** mantenha um backup do mundo e teste com uma conta Player real, não apenas na sessão do GM.

## Limites e manutenção

O HIM não substitui as regras de Inspiração do D&D5e, não inclui o conteúdo do JB2A, não modifica Character Builder ou Plutonium e não fornece um mecanismo genérico de autorização silenciosa por GM para transações de terceiros. O suporte a Foundry/D&D5e indicado é uma declaração de compatibilidade do projeto; integrações de terceiros devem ser validadas no ambiente real.

- **Repositório:** https://github.com/hammer-PvP/Heroic-Inspiration-Manager
- **Problemas e sugestões:** https://github.com/hammer-PvP/Heroic-Inspiration-Manager/issues
- **Histórico de alterações:** [CHANGELOG.md](CHANGELOG.md) — todas as mudanças por versão ficam aqui, não neste guia.
- **Licença:** [MIT](LICENSE).

A publicação no catálogo oficial do Foundry, inclusive a revisão de descrições e materiais auxiliares conforme suas regras, permanece sob responsabilidade do autor.
