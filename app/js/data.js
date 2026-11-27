// Definições estáticas do jogo: setores, atributos, classes, dificuldades,
// objetivos sugeridos, conquistas, chefes e itens da loja.

export const ATTRS = {
  for: { name: 'Força', short: 'FOR', color: '#ef7d57' },
  vit: { name: 'Vitalidade', short: 'VIT', color: '#b13e53' },
  foc: { name: 'Foco', short: 'FOC', color: '#41a6f6' },
  riq: { name: 'Riqueza', short: 'RIQ', color: '#ffcd75' },
  ene: { name: 'Energia', short: 'ENE', color: '#8a7cf0' },
  sab: { name: 'Sabedoria', short: 'SAB', color: '#3cc0c0' },
  esp: { name: 'Espírito', short: 'ESP', color: '#c060e0' },
  car: { name: 'Carisma', short: 'CAR', color: '#38b764' },
  cri: { name: 'Criatividade', short: 'CRI', color: '#e060a0' },
  org: { name: 'Organização', short: 'ORG', color: '#c2a070' },
};

export const SECTORS = {
  alimentacao: { name: 'Alimentação', attr: 'vit', icon: 'apple', color: '#b13e53', core: true, desc: 'Água, refeições e peso' },
  academia: { name: 'Academia', attr: 'for', icon: 'dumbbell', color: '#ef7d57', core: true, desc: 'Treinos e condicionamento' },
  trabalho: { name: 'Trabalho', attr: 'foc', icon: 'briefcase', color: '#41a6f6', core: true, desc: 'Prioridades e Pomodoro' },
  financeiro: { name: 'Financeiro', attr: 'riq', icon: 'coin', color: '#ffcd75', core: true, desc: 'Receitas, gastos e orçamento' },
  conteudo: { name: 'Conteúdo', attr: 'cri', icon: 'phone', color: '#e060a0', desc: 'Posts, clientes e calendário' },
  casa: { name: 'Casa', attr: 'org', icon: 'house', color: '#c2a070', desc: 'Tarefas domésticas a dois' },
  sono: { name: 'Sono', attr: 'ene', icon: 'moon', color: '#8a7cf0', desc: 'Horas dormidas e descanso' },
  estudos: { name: 'Estudos', attr: 'sab', icon: 'book', color: '#3cc0c0', desc: 'Leitura e aprendizado' },
  mente: { name: 'Mente', attr: 'esp', icon: 'spark', color: '#c060e0', desc: 'Humor, diário e meditação' },
  social: { name: 'Social', attr: 'car', icon: 'chat', color: '#38b764', desc: 'Amigos, família e relações' },
};
export const SECTOR_IDS = Object.keys(SECTORS);

export const CLASSES = {
  guerreiro: { name: 'Guerreiro', desc: '+10% XP em Academia e Casa', bonusSectors: ['academia', 'casa'], weapon: 'sword' },
  mago: { name: 'Mago', desc: '+10% XP em Trabalho, Estudos e Conteúdo', bonusSectors: ['trabalho', 'estudos', 'conteudo'], weapon: 'staff' },
  druida: { name: 'Druida', desc: '+10% XP em Alimentação, Sono e Mente', bonusSectors: ['alimentacao', 'sono', 'mente'], weapon: 'leaf' },
  mercador: { name: 'Mercador', desc: '+10% de ouro sempre e +10% XP em Financeiro', bonusSectors: ['financeiro'], goldBonus: 0.1, weapon: 'bag' },
};

export const DIFFICULTY = {
  facil: { name: 'Fácil', xp: 10, gold: 4, dmg: 2, pts: 1 },
  medio: { name: 'Médio', xp: 20, gold: 8, dmg: 3, pts: 2 },
  dificil: { name: 'Difícil', xp: 35, gold: 14, dmg: 5, pts: 3 },
  epico: { name: 'Épico', xp: 60, gold: 25, dmg: 7, pts: 5 },
};

export const QUEST_TYPES = {
  daily: 'Diária',
  weekly: 'Semanal',
  once: 'Única',
  habit: 'Hábito',
};

const WEEKDAYS_ONLY = [1, 2, 3, 4, 5];

// Objetivos sugeridos no cadastro. Cada um vira um Objetivo e gera missões/hábitos.
export const OBJECTIVE_PRESETS = [
  { id: 'comer-melhor', sector: 'alimentacao', title: 'Comer melhor',
    quests: [
      { title: 'Beber a meta de água', diff: 'facil' },
      { title: 'Comer uma fruta', diff: 'facil' },
      { title: 'Refeição caseira e saudável', diff: 'medio' },
    ],
    habits: [{ title: 'Fast food ou doce fora de hora', negative: true, diff: 'medio' }] },
  { id: 'perder-peso', sector: 'alimentacao', title: 'Perder peso',
    goal: { kind: 'numeric', unit: 'kg', target: 5, title: 'Perder 5 kg' },
    quests: [
      { title: 'Não comer depois das 21h', diff: 'medio' },
      { title: 'Caminhar 30 min', diff: 'medio', sector: 'academia' },
    ] },
  { id: 'treinar', sector: 'academia', title: 'Treinar com consistência',
    quests: [
      { title: 'Treino de 45 min', diff: 'dificil', days: WEEKDAYS_ONLY },
      { title: 'Alongar 10 min', diff: 'facil' },
    ] },
  { id: 'ganhar-massa', sector: 'academia', title: 'Ganhar massa muscular',
    quests: [
      { title: 'Bater a meta de proteína', diff: 'medio', sector: 'alimentacao' },
      { title: 'Treino de força', diff: 'dificil', days: [1, 3, 5] },
    ] },
  { id: 'produtivo', sector: 'trabalho', title: 'Ser mais produtivo no trabalho',
    quests: [
      { title: 'Definir as 3 prioridades do dia', diff: 'facil', days: WEEKDAYS_ONLY },
      { title: 'Fazer 2 Pomodoros de foco', diff: 'medio', days: WEEKDAYS_ONLY },
    ],
    habits: [{ title: 'Distração com redes sociais', negative: true, diff: 'facil' }] },
  { id: 'organizar', sector: 'trabalho', title: 'Organizar minha rotina',
    quests: [
      { title: 'Planejar o dia seguinte', diff: 'facil' },
      { title: 'Revisão semanal da agenda', diff: 'medio', type: 'weekly' },
    ] },
  { id: 'controlar-gastos', sector: 'financeiro', title: 'Controlar meus gastos',
    quests: [
      { title: 'Registrar os gastos do dia', diff: 'facil' },
      { title: 'Revisar o orçamento da semana', diff: 'medio', type: 'weekly' },
    ],
    habits: [{ title: 'Compra por impulso', negative: true, diff: 'dificil' }] },
  { id: 'reserva', sector: 'financeiro', title: 'Montar reserva de emergência',
    goal: { kind: 'numeric', unit: 'R$', target: 5000, title: 'Juntar R$ 5.000 de reserva' },
    quests: [{ title: 'Guardar dinheiro na reserva', diff: 'medio', type: 'weekly' }] },
  { id: 'dormir', sector: 'sono', title: 'Dormir melhor',
    quests: [
      { title: 'Deitar antes das 23h', diff: 'medio', time: '22:45', remind: 15 },
      { title: 'Sem telas 30 min antes de dormir', diff: 'medio', time: '22:30' },
    ] },
  { id: 'estudar', sector: 'estudos', title: 'Estudar mais',
    quests: [
      { title: 'Estudar 30 min', diff: 'medio' },
      { title: 'Ler 10 páginas', diff: 'facil' },
    ] },
  { id: 'mente', sector: 'mente', title: 'Cuidar da saúde mental',
    quests: [
      { title: 'Meditar 5 min', diff: 'facil', time: '07:15' },
      { title: 'Escrever no diário', diff: 'facil', time: '22:15' },
    ] },
  { id: 'social', sector: 'social', title: 'Fortalecer minhas relações',
    quests: [
      { title: 'Mensagem carinhosa para meu amor', diff: 'facil', time: '12:00' },
      { title: 'Mandar mensagem para um amigo ou familiar', diff: 'facil' },
      { title: 'Encontro com amigos ou família', diff: 'medio', type: 'weekly' },
    ] },
  { id: 'conteudo-consistente', sector: 'conteudo', title: 'Postar com consistência',
    quests: [
      { title: 'Responder DMs e comentários', diff: 'medio', time: '11:00', days: WEEKDAYS_ONLY },
      { title: 'Checar métricas do dia', diff: 'facil', time: '17:30', days: WEEKDAYS_ONLY },
      { title: 'Planejar o calendário da semana', diff: 'dificil', type: 'weekly' },
    ],
    habits: [{ title: 'Rolar o feed sem objetivo', negative: true, diff: 'facil' }] },
  { id: 'casa-em-dia', sector: 'casa', title: 'Manter a casa em dia',
    quests: [
      { title: 'Lavar a louça', diff: 'facil', time: '21:00' },
      { title: 'Organizar a casa (15 min)', diff: 'facil' },
      { title: 'Faxina da semana', diff: 'dificil', type: 'weekly' },
    ] },
];

// Chefes semanais: um novo surge toda segunda-feira.
export const BOSSES = [
  { name: 'Dragão da Procrastinação', color: '#b13e53', taunt: 'Deixa pra amanhã...' },
  { name: 'Golem do Sedentarismo', color: '#8a8a9a', taunt: 'O sofá te chama.' },
  { name: 'Slime do Açúcar', color: '#e060a0', taunt: 'Só mais um docinho!' },
  { name: 'Lich das Dívidas', color: '#5ccf6a', taunt: 'Parcela em 12x?' },
  { name: 'Hidra da Distração', color: '#41a6f6', taunt: 'Olha o celular!' },
  { name: 'Espectro da Insônia', color: '#8a7cf0', taunt: 'Só mais um episódio...' },
  { name: 'Ogro do Caos', color: '#ef7d57', taunt: 'Quem precisa de plano?' },
];

export const BUILTIN_ITEMS = [
  { id: 'potion', title: 'Poção de Vida', desc: 'Recupera 20 HP', cost: 25, icon: 'potion', heal: 20 },
  { id: 'elixir', title: 'Elixir Completo', desc: 'Recupera todo o HP', cost: 60, icon: 'potion', heal: 9999 },
];

export const REWARD_EMOJIS = ['🎁', '🎮', '📺', '🍕', '🍰', '☕', '🎬', '🛍️', '🏖️', '😴', '🍺', '🎧', '📚', '💆'];

export const DEFAULT_REWARDS = [
  { title: 'Assistir um episódio de série', cost: 30, emoji: '📺' },
  { title: 'Sobremesa favorita', cost: 50, emoji: '🍰' },
  { title: '1h de videogame', cost: 60, emoji: '🎮' },
  { title: 'Pedir um delivery', cost: 120, emoji: '🍕' },
  { title: 'Comprar algo que eu quero', cost: 250, emoji: '🛍️' },
  { title: 'Dia de folga sem culpa', cost: 400, emoji: '🏖️' },
];

export const WORKOUT_TYPES = ['Musculação', 'Cardio', 'Corrida', 'Funcional', 'Esporte', 'Natação', 'Ciclismo', 'Alongamento/Yoga', 'Luta', 'Outro'];
export const INTENSITY = { leve: { name: 'Leve', mult: 1 }, moderada: { name: 'Moderada', mult: 1.25 }, intensa: { name: 'Intensa', mult: 1.5 } };

export const FIN_CATEGORIES = {
  out: ['Alimentação', 'Mercado', 'Transporte', 'Moradia', 'Contas', 'Saúde', 'Educação', 'Lazer', 'Compras', 'Assinaturas', 'Outros'],
  in: ['Salário', 'Freelance', 'Investimentos', 'Presente', 'Outros'],
};

export const MEALS = [
  { id: 'cafe', name: 'Café da manhã' },
  { id: 'almoco', name: 'Almoço' },
  { id: 'lanche', name: 'Lanche' },
  { id: 'jantar', name: 'Jantar' },
];

export const MOODS = [
  { v: 1, label: 'Péssimo', face: 'x_x' },
  { v: 2, label: 'Mal', face: '-_-' },
  { v: 3, label: 'Ok', face: 'o_o' },
  { v: 4, label: 'Bem', face: '^_^' },
  { v: 5, label: 'Ótimo', face: '\\o/' },
];

export const ACHIEVEMENTS = [
  { id: 'q1', name: 'Primeiro Passo', desc: 'Complete sua primeira missão', icon: 'scroll', gold: 10, test: (s) => s.stats.questsDone >= 1 },
  { id: 'q25', name: 'Aventureiro', desc: 'Complete 25 missões', icon: 'scroll', gold: 25, test: (s) => s.stats.questsDone >= 25 },
  { id: 'q100', name: 'Veterano', desc: 'Complete 100 missões', icon: 'scroll', gold: 60, test: (s) => s.stats.questsDone >= 100 },
  { id: 'q500', name: 'Lenda Viva', desc: 'Complete 500 missões', icon: 'trophy', gold: 200, test: (s) => s.stats.questsDone >= 500 },
  { id: 's3', name: 'Aquecendo', desc: 'Sequência de 3 dias numa missão', icon: 'fire', gold: 10, test: (s) => s.stats.bestStreak >= 3 },
  { id: 's7', name: 'Imparável', desc: 'Sequência de 7 dias numa missão', icon: 'fire', gold: 30, test: (s) => s.stats.bestStreak >= 7 },
  { id: 's30', name: 'Disciplina de Ferro', desc: 'Sequência de 30 dias numa missão', icon: 'fire', gold: 150, test: (s) => s.stats.bestStreak >= 30 },
  { id: 'd7', name: 'Rotina Ativa', desc: 'Jogue 7 dias seguidos', icon: 'sun', gold: 30, test: (s) => s.stats.bestDayStreak >= 7 },
  { id: 'l5', name: 'Nível 5', desc: 'Alcance o nível 5', icon: 'star', gold: 25, test: (s) => s.player.level >= 5 },
  { id: 'l10', name: 'Nível 10', desc: 'Alcance o nível 10', icon: 'star', gold: 60, test: (s) => s.player.level >= 10 },
  { id: 'l25', name: 'Nível 25', desc: 'Alcance o nível 25', icon: 'star', gold: 200, test: (s) => s.player.level >= 25 },
  { id: 'b1', name: 'Caçador de Chefes', desc: 'Derrote um chefe semanal', icon: 'sword', gold: 40, test: (s) => s.stats.bossesDefeated >= 1 },
  { id: 'b5', name: 'Exterminador', desc: 'Derrote 5 chefes semanais', icon: 'sword', gold: 120, test: (s) => s.stats.bossesDefeated >= 5 },
  { id: 'r1', name: 'Merecido!', desc: 'Resgate sua primeira recompensa', icon: 'chest', gold: 5, test: (s) => s.stats.rewardsBought >= 1 },
  { id: 'r10', name: 'Colecionador', desc: 'Resgate 10 recompensas', icon: 'chest', gold: 30, test: (s) => s.stats.rewardsBought >= 10 },
  { id: 'g1', name: 'Objetivo Alcançado', desc: 'Conclua um objetivo', icon: 'trophy', gold: 50, test: (s) => s.stats.goalsDone >= 1 },
  { id: 'g5', name: 'Visionário', desc: 'Conclua 5 objetivos', icon: 'trophy', gold: 150, test: (s) => s.stats.goalsDone >= 5 },
  { id: 'w7', name: 'Bem Hidratado', desc: 'Bata a meta de água em 7 dias', icon: 'apple', gold: 30, test: (s) => s.stats.waterDays >= 7 },
  { id: 'gym20', name: 'Rato de Academia', desc: 'Registre 20 treinos', icon: 'dumbbell', gold: 50, test: (s) => s.stats.workouts >= 20 },
  { id: 'pomo25', name: 'Mente Afiada', desc: 'Complete 25 Pomodoros', icon: 'briefcase', gold: 50, test: (s) => s.stats.pomodoros >= 25 },
  { id: 'fin10', name: 'Contador Real', desc: 'Faça 10 registros financeiros', icon: 'coin', gold: 30, test: (s) => s.stats.financeEntries >= 10 },
  { id: 'rich', name: 'Cofre Cheio', desc: 'Junte 1.000 de ouro', icon: 'coin', gold: 0, test: (s) => s.player.gold >= 1000 },
  { id: 'ontime20', name: 'Pontualidade Britânica', desc: 'Conclua 20 tarefas no horário', icon: 'clock', gold: 40, test: (s) => s.stats.onTime >= 20 },
  { id: 'perfect1', name: 'Dia Perfeito', desc: 'Conclua todas as tarefas de um dia', icon: 'star', gold: 15, test: (s) => s.stats.perfectDays >= 1 },
  { id: 'perfect7', name: 'Semana Lendária', desc: 'Tenha 7 dias perfeitos', icon: 'star', gold: 60, test: (s) => s.stats.perfectDays >= 7 },
  { id: 'post10', name: 'Criador de Conteúdo', desc: 'Publique 10 posts', icon: 'phone', gold: 30, test: (s) => s.stats.postsPublished >= 10 },
  { id: 'post100', name: 'Máquina de Conteúdo', desc: 'Publique 100 posts', icon: 'phone', gold: 150, test: (s) => s.stats.postsPublished >= 100 },
  { id: 'party', name: 'Party Formada', desc: 'Entre em um grupo', icon: 'group', gold: 20, test: (s) => !!s.cloud?.groupId },
  { id: 'cheer10', name: 'Torcida Organizada', desc: 'Envie 10 incentivos', icon: 'heart', gold: 30, test: (s) => s.stats.cheersSent >= 10 },
  { id: 'shared20', name: 'Parceria Perfeita', desc: 'Conclua 20 missões da casa', icon: 'house', gold: 50, test: (s) => s.stats.sharedDone >= 20 },
];

export const TIPS = [
  'Missões diárias não feitas tiram HP à meia-noite (no máximo metade do HP por noite). Use o Modo Descanso se precisar de uma pausa.',
  'Cada missão concluída também causa dano ao chefe da semana.',
  'Sequências aumentam o XP e o ouro: até +50%!',
  'Crie recompensas reais na Loja e gaste seu ouro sem culpa.',
  'Faça backup do seu progresso em Herói > Configurações.',
  'Hábitos negativos tiram HP: registre com honestidade, é por você!',
  'Tarefas com horário dão +20% de XP se feitas no horário (até 30 min depois).',
  'Na aba Grupo, você e sua dupla enfrentam o mesmo chefe e dividem as missões da casa.',
  'Procurando ideias de hábitos? Use a Biblioteca na aba Missões.',
];

// ---------- agenda e lembretes ----------
export const REMIND_OPTIONS = [
  { v: '', label: 'Sem lembrete' },
  { v: '0', label: 'Na hora' },
  { v: '5', label: '5 min antes' },
  { v: '15', label: '15 min antes' },
  { v: '30', label: '30 min antes' },
  { v: '60', label: '1 h antes' },
];

// ---------- conteúdo (social media) ----------
export const PLATFORMS = {
  instagram: { name: 'Instagram', short: 'IG', color: '#e1306c' },
  tiktok: { name: 'TikTok', short: 'TT', color: '#25f4ee' },
  youtube: { name: 'YouTube', short: 'YT', color: '#ff4040' },
  linkedin: { name: 'LinkedIn', short: 'IN', color: '#3b8fe0' },
  facebook: { name: 'Facebook', short: 'FB', color: '#4a8af4' },
  x: { name: 'X / Twitter', short: 'X', color: '#f4f4f4' },
  threads: { name: 'Threads', short: '@', color: '#f4f4f4' },
  pinterest: { name: 'Pinterest', short: 'PIN', color: '#e60023' },
  blog: { name: 'Blog / Site', short: 'WEB', color: '#94b0c2' },
  outro: { name: 'Outro', short: '•', color: '#94b0c2' },
};
export const FORMATS = {
  reels: { name: 'Reels', xp: 30 },
  carrossel: { name: 'Carrossel', xp: 25 },
  post: { name: 'Post de foto', xp: 20 },
  story: { name: 'Stories', xp: 10 },
  video: { name: 'Vídeo', xp: 30 },
  short: { name: 'Short', xp: 25 },
  live: { name: 'Live', xp: 35 },
  artigo: { name: 'Artigo', xp: 30 },
  thread: { name: 'Thread', xp: 15 },
};
export const POST_STATUS = {
  ideia: { name: 'Ideia', color: '#94b0c2' },
  producao: { name: 'Produzindo', color: '#41a6f6' },
  pronto: { name: 'Pronto', color: '#ffcd75' },
  postado: { name: 'Publicado', color: '#a7f070' },
};
export const STATUS_ORDER = ['ideia', 'producao', 'pronto', 'postado'];
export const CLIENT_COLORS = ['#e060a0', '#41a6f6', '#ffcd75', '#a7f070', '#ef7d57', '#b070ff', '#3cc0c0', '#f4f4f4'];

// ---------- rotina / profissão ----------
export const PROFESSIONS = {
  socialmedia: { name: 'Social Media', sectors: ['conteudo', 'trabalho'],
    quests: [
      { title: 'Pesquisar tendências e referências', sector: 'conteudo', diff: 'facil', time: '09:30', days: WEEKDAYS_ONLY },
      { title: 'Responder DMs e comentários', sector: 'conteudo', diff: 'medio', time: '11:00', days: WEEKDAYS_ONLY },
      { title: 'Checar métricas do dia', sector: 'conteudo', diff: 'facil', time: '17:30', days: WEEKDAYS_ONLY },
      { title: 'Planejar o calendário da semana', sector: 'conteudo', diff: 'dificil', type: 'weekly' },
      { title: 'Enviar relatório aos clientes', sector: 'conteudo', diff: 'medio', type: 'weekly' },
    ] },
  escritorio: { name: 'Escritório / Home office', sectors: ['trabalho'],
    quests: [{ title: 'Planejar o dia', sector: 'trabalho', diff: 'facil', time: '08:45', days: WEEKDAYS_ONLY }] },
  estudante: { name: 'Estudante', sectors: ['estudos'],
    quests: [{ title: 'Revisar a matéria do dia', sector: 'estudos', diff: 'medio', time: '19:00', days: WEEKDAYS_ONLY }] },
  autonomo: { name: 'Autônomo / Freelancer', sectors: ['trabalho', 'financeiro'],
    quests: [
      { title: 'Prospectar um cliente novo', sector: 'trabalho', diff: 'medio', type: 'weekly' },
      { title: 'Emitir notas e cobranças', sector: 'financeiro', diff: 'medio', type: 'weekly' },
    ] },
  saude: { name: 'Área da saúde', sectors: ['trabalho'],
    quests: [{ title: 'Pausa para alongar e beber água', sector: 'alimentacao', diff: 'facil', time: '15:00' }] },
  outro: { name: 'Outro', sectors: [], quests: [] },
};

// ---------- biblioteca de hábitos ----------
export const HABIT_LIBRARY = {
  alimentacao: [
    { title: "Beber um copo d'água ao acordar", type: 'daily', diff: 'facil', time: '07:00' },
    { title: 'Café da manhã com proteína', type: 'daily', diff: 'facil', time: '08:00' },
    { title: 'Levar marmita', type: 'daily', diff: 'medio', days: WEEKDAYS_ONLY, time: '07:30' },
    { title: 'Comer salada no almoço', type: 'daily', diff: 'facil', time: '12:30' },
    { title: 'Comer uma fruta', type: 'habit', diff: 'facil' },
    { title: 'Refrigerante ou doce fora de hora', type: 'habit', diff: 'medio', negative: true },
    { title: 'Planejar as refeições da semana', type: 'weekly', diff: 'medio' },
  ],
  academia: [
    { title: 'Treino de musculação', type: 'daily', diff: 'dificil', days: WEEKDAYS_ONLY, time: '07:00' },
    { title: 'Caminhada de 30 min', type: 'daily', diff: 'medio', time: '19:00' },
    { title: 'Bater 8 mil passos', type: 'daily', diff: 'medio' },
    { title: 'Alongar 10 min', type: 'daily', diff: 'facil', time: '21:30' },
    { title: 'Subir de escada', type: 'habit', diff: 'facil' },
    { title: 'Corrida longa', type: 'weekly', diff: 'epico' },
  ],
  trabalho: [
    { title: 'Planejar o dia', type: 'daily', diff: 'facil', days: WEEKDAYS_ONLY, time: '08:45' },
    { title: 'Bloco de foco sem celular', type: 'daily', diff: 'medio', days: WEEKDAYS_ONLY, time: '09:00' },
    { title: 'Zerar a caixa de e-mails', type: 'daily', diff: 'medio', days: WEEKDAYS_ONLY, time: '16:30' },
    { title: 'Revisão semanal', type: 'weekly', diff: 'medio' },
    { title: 'Procrastinar uma tarefa importante', type: 'habit', diff: 'medio', negative: true },
  ],
  conteudo: [
    { title: 'Postar conteúdo em um horário marcado', kind: 'post' },
    { title: 'Pesquisar tendências e referências', type: 'daily', diff: 'facil', days: WEEKDAYS_ONLY, time: '09:30' },
    { title: 'Responder DMs e comentários', type: 'daily', diff: 'medio', days: WEEKDAYS_ONLY, time: '11:00' },
    { title: 'Postar os Stories do dia', type: 'daily', diff: 'facil', days: WEEKDAYS_ONLY, time: '12:00' },
    { title: 'Checar métricas do dia', type: 'daily', diff: 'facil', days: WEEKDAYS_ONLY, time: '17:30' },
    { title: 'Engajar com perfis do nicho (15 min)', type: 'daily', diff: 'facil', time: '18:30' },
    { title: 'Planejar o calendário da semana', type: 'weekly', diff: 'dificil' },
    { title: 'Gravar conteúdos em lote', type: 'weekly', diff: 'dificil' },
    { title: 'Enviar relatório aos clientes', type: 'weekly', diff: 'medio' },
    { title: 'Rolar o feed sem objetivo', type: 'habit', diff: 'facil', negative: true },
  ],
  financeiro: [
    { title: 'Registrar os gastos do dia', type: 'daily', diff: 'facil', time: '21:30' },
    { title: 'Dia sem cartão de crédito', type: 'daily', diff: 'medio' },
    { title: 'Guardar dinheiro na reserva', type: 'weekly', diff: 'medio' },
    { title: 'Revisar a fatura do cartão', type: 'weekly', diff: 'facil' },
    { title: 'Compra por impulso', type: 'habit', diff: 'dificil', negative: true },
  ],
  casa: [
    { title: 'Arrumar a cama', type: 'daily', diff: 'facil', time: '07:30' },
    { title: 'Lavar a louça', type: 'daily', diff: 'facil', time: '21:00' },
    { title: 'Organizar a casa (15 min)', type: 'daily', diff: 'facil' },
    { title: 'Tirar o lixo', type: 'daily', diff: 'facil', days: [1, 3, 5], time: '20:00' },
    { title: 'Regar as plantas', type: 'daily', diff: 'facil', days: [1, 4] },
    { title: 'Lavar roupa', type: 'weekly', diff: 'medio' },
    { title: 'Fazer o mercado', type: 'weekly', diff: 'medio' },
    { title: 'Faxina da semana', type: 'weekly', diff: 'dificil' },
  ],
  sono: [
    { title: 'Ir para a cama no horário', type: 'daily', diff: 'medio', time: '22:45', remind: 15 },
    { title: 'Sem telas 30 min antes de dormir', type: 'daily', diff: 'medio', time: '22:30' },
    { title: 'Acordar no horário', type: 'daily', diff: 'facil', time: '07:00' },
    { title: 'Café depois das 16h', type: 'habit', diff: 'facil', negative: true },
  ],
  estudos: [
    { title: 'Estudar 30 min', type: 'daily', diff: 'medio', time: '20:00' },
    { title: 'Ler 10 páginas', type: 'daily', diff: 'facil', time: '22:00' },
    { title: 'Assistir uma aula do curso', type: 'daily', diff: 'medio', days: WEEKDAYS_ONLY },
    { title: 'Revisar anotações da semana', type: 'weekly', diff: 'medio' },
  ],
  mente: [
    { title: 'Meditar 5 min', type: 'daily', diff: 'facil', time: '07:15' },
    { title: 'Gratidão: anotar 3 coisas boas', type: 'daily', diff: 'facil', time: '22:15' },
    { title: 'Terapia', type: 'weekly', diff: 'medio' },
    { title: 'Pausa para respirar', type: 'habit', diff: 'facil' },
    { title: 'Reclamar à toa', type: 'habit', diff: 'facil', negative: true },
  ],
  social: [
    { title: 'Mensagem carinhosa para meu amor', type: 'daily', diff: 'facil', time: '12:00' },
    { title: 'Jantar juntos sem celular', type: 'daily', diff: 'medio', time: '20:00' },
    { title: 'Date a dois', type: 'weekly', diff: 'dificil' },
    { title: 'Ligar para a família', type: 'weekly', diff: 'facil' },
    { title: 'Elogiar alguém', type: 'habit', diff: 'facil' },
  ],
};

// ---------- grupo ----------
export const CHEERS = [
  { id: 'forca', emoji: '💪', text: 'Força, você consegue!' },
  { id: 'mandou', emoji: '👏', text: 'Mandou muito bem!' },
  { id: 'orgulho', emoji: '❤️', text: 'Tenho muito orgulho de você!' },
  { id: 'juntos', emoji: '🤝', text: 'Bora fazer juntos?' },
  { id: 'sequencia', emoji: '🔥', text: 'Não quebra a sequência!' },
  { id: 'agua', emoji: '💧', text: 'Já bebeu água hoje?' },
  { id: 'descanso', emoji: '😴', text: 'Hora de descansar, viu?' },
];
export const HEAL = { cost: 20, amount: 15 };
