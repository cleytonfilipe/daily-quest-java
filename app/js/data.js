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
};

export const SECTORS = {
  alimentacao: { name: 'Alimentação', attr: 'vit', icon: 'apple', color: '#b13e53', core: true, desc: 'Água, refeições e peso' },
  academia: { name: 'Academia', attr: 'for', icon: 'dumbbell', color: '#ef7d57', core: true, desc: 'Treinos e condicionamento' },
  trabalho: { name: 'Trabalho', attr: 'foc', icon: 'briefcase', color: '#41a6f6', core: true, desc: 'Prioridades e Pomodoro' },
  financeiro: { name: 'Financeiro', attr: 'riq', icon: 'coin', color: '#ffcd75', core: true, desc: 'Receitas, gastos e orçamento' },
  sono: { name: 'Sono', attr: 'ene', icon: 'moon', color: '#8a7cf0', desc: 'Horas dormidas e descanso' },
  estudos: { name: 'Estudos', attr: 'sab', icon: 'book', color: '#3cc0c0', desc: 'Leitura e aprendizado' },
  mente: { name: 'Mente', attr: 'esp', icon: 'spark', color: '#c060e0', desc: 'Humor, diário e meditação' },
  social: { name: 'Social', attr: 'car', icon: 'chat', color: '#38b764', desc: 'Amigos, família e relações' },
};
export const SECTOR_IDS = Object.keys(SECTORS);

export const CLASSES = {
  guerreiro: { name: 'Guerreiro', desc: '+10% XP em Academia', bonusSectors: ['academia'], weapon: 'sword' },
  mago: { name: 'Mago', desc: '+10% XP em Trabalho e Estudos', bonusSectors: ['trabalho', 'estudos'], weapon: 'staff' },
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
      { title: 'Deitar antes das 23h', diff: 'medio' },
      { title: 'Sem telas 30 min antes de dormir', diff: 'medio' },
    ] },
  { id: 'estudar', sector: 'estudos', title: 'Estudar mais',
    quests: [
      { title: 'Estudar 30 min', diff: 'medio' },
      { title: 'Ler 10 páginas', diff: 'facil' },
    ] },
  { id: 'mente', sector: 'mente', title: 'Cuidar da saúde mental',
    quests: [
      { title: 'Meditar 5 min', diff: 'facil' },
      { title: 'Escrever no diário', diff: 'facil' },
    ] },
  { id: 'social', sector: 'social', title: 'Fortalecer minhas relações',
    quests: [
      { title: 'Mandar mensagem para um amigo ou familiar', diff: 'facil' },
      { title: 'Encontro com amigos ou família', diff: 'medio', type: 'weekly' },
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
];

export const TIPS = [
  'Missões diárias não feitas tiram HP à meia-noite (no máximo metade do HP por noite). Use o Modo Descanso se precisar de uma pausa.',
  'Cada missão concluída também causa dano ao chefe da semana.',
  'Sequências aumentam o XP e o ouro: até +50%!',
  'Crie recompensas reais na Loja e gaste seu ouro sem culpa.',
  'Faça backup do seu progresso em Herói > Configurações.',
  'Hábitos negativos tiram HP: registre com honestidade, é por você!',
];
