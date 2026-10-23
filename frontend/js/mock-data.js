const DAY = 86_400_000;

function isoDate(offsetDays = 0) {
  const date = new Date(Date.now() + (offsetDays * DAY));
  return date.toISOString().slice(0, 10);
}

const image = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1100&q=84`;
const virtualFrame = new URL("../assets/images/virtual/armacao-azul.png", import.meta.url).href;

export const LEGACY_SEED_PRODUCT_IMAGES = Object.freeze({
  5: image("photo-1517841905240-472988babdf9"),
  8: image("photo-1577803645773-f96470509666"),
  10: image("photo-1556306535-0f09a537f0a3"),
  11: image("photo-1556306535-38febf6782e7"),
  12: image("photo-1529139574466-a303027c1d8b"),
});

export function createMockData() {
  const categories = [
    { id: 1, nome: "Graduados", descricao: "Armações confortáveis para o dia-a-dia.", ativo: true, criadoEm: new Date().toISOString() },
    { id: 2, nome: "Óculos de Sol", descricao: "Estilo e protecção para dias luminosos.", ativo: true, criadoEm: new Date().toISOString() },
    { id: 3, nome: "Infantil", descricao: "Modelos leves e resistentes para os mais novos.", ativo: true, criadoEm: new Date().toISOString() },
    { id: 4, nome: "Feminino", descricao: "Formas contemporâneas com detalhes elegantes.", ativo: true, criadoEm: new Date().toISOString() },
    { id: 5, nome: "Masculino", descricao: "Linhas clássicas e modernas para todos os dias.", ativo: true, criadoEm: new Date().toISOString() },
  ];

  const products = [
    { id: 1, nome: "Maputo Classic", descricao: "Armação leve de linhas equilibradas, pensada para uma utilização confortável ao longo do dia.", preco: 3500, categoriaId: 1, imagem: image("photo-1511499767150-a48a237f0083"), imagemModelo: image("photo-1656328120588-606ec5e73678"), disponivel: true, destaque: true, testeVirtual: true, imagemVirtual: virtualFrame, criadoEm: "2026-08-24T09:30:00.000Z" },
    { id: 2, nome: "Índico Tartaruga", descricao: "Uma silhueta expressiva em tom tartaruga, com hastes finas e acabamento polido.", preco: 4200, categoriaId: 4, imagem: image("photo-1574258495973-f010dfbb5371"), imagemModelo: image("photo-1750390200298-3d5f30f670a1"), disponivel: true, destaque: true, testeVirtual: true, imagemVirtual: virtualFrame, criadoEm: "2026-08-27T11:00:00.000Z" },
    { id: 3, nome: "Baía Solar", descricao: "Óculos de sol de formato arredondado, com presença marcante e utilização versátil.", preco: 3900, categoriaId: 2, imagem: image("photo-1508296695146-257a814070b4"), imagemModelo: image("photo-1651378499332-2d578930b9b4"), disponivel: true, destaque: true, testeVirtual: true, imagemVirtual: virtualFrame, criadoEm: "2026-08-29T14:20:00.000Z" },
    { id: 4, nome: "Xipamanine Azul", descricao: "Armação azul profunda com perfil contemporâneo e ponte confortável.", preco: 3200, categoriaId: 1, imagem: image("photo-1577803645773-f96470509666"), imagemModelo: image("photo-1567074693913-6f423e35c0ba"), disponivel: true, destaque: false, testeVirtual: false, imagemVirtual: "", criadoEm: "2026-09-01T08:10:00.000Z" },
    { id: 5, nome: "Acácia Dourada", descricao: "Estrutura metálica delicada, leve no rosto e fácil de combinar.", preco: 4700, categoriaId: 4, imagem: image("photo-1649119161997-00ffc8c24e11"), imagemModelo: image("photo-1770853800364-47542a73f22c"), disponivel: true, destaque: true, testeVirtual: true, imagemVirtual: virtualFrame, criadoEm: "2026-09-03T10:45:00.000Z" },
    { id: 6, nome: "Marracuene Preto", descricao: "Design rectangular em preto mate, discreto e adequado a diferentes ocasiões.", preco: 3600, categoriaId: 5, imagem: image("photo-1473496169904-658ba7c44d8a"), imagemModelo: image("photo-1651218859577-97abc369d12f"), disponivel: true, destaque: false, testeVirtual: true, imagemVirtual: virtualFrame, criadoEm: "2026-09-04T13:00:00.000Z" },
    { id: 7, nome: "Matola Move", descricao: "Armação flexível de perfil desportivo para uma rotina dinâmica.", preco: 3000, categoriaId: 5, imagem: image("photo-1530432999454-016a47c78af3"), imagemModelo: image("photo-1752486268357-e43b17dbaa23"), disponivel: true, destaque: false, testeVirtual: false, imagemVirtual: "", criadoEm: "2026-09-05T15:30:00.000Z" },
    { id: 8, nome: "Pequeno Explorador", descricao: "Modelo infantil leve, colorido e preparado para acompanhar muitas brincadeiras.", preco: 2400, categoriaId: 3, imagem: image("photo-1656684231453-f2c65c490892"), imagemModelo: image("photo-1716041733722-90d394e4c4d8"), disponivel: true, destaque: false, testeVirtual: false, imagemVirtual: "", criadoEm: "2026-09-06T09:15:00.000Z" },
    { id: 9, nome: "Zambeze Crystal", descricao: "Armação translúcida com linhas suaves e um acabamento luminoso.", preco: 4100, categoriaId: 4, imagem: image("photo-1591076482161-42ce6da69f67"), imagemModelo: image("photo-1758876201853-31f6bc71f390"), disponivel: true, destaque: true, testeVirtual: true, imagemVirtual: virtualFrame, criadoEm: "2026-09-07T12:00:00.000Z" },
    { id: 10, nome: "Polana Aviador", descricao: "Interpretação elegante do formato aviador, com estrutura metálica fina.", preco: 5200, categoriaId: 2, imagem: image("photo-1759227922040-0ca4d3cbe42e"), imagemModelo: image("photo-1509985318872-7738c6e874f0"), disponivel: true, destaque: false, testeVirtual: true, imagemVirtual: virtualFrame, criadoEm: "2026-09-08T16:10:00.000Z" },
    { id: 11, nome: "Mafalala Redondo", descricao: "Formato redondo de inspiração clássica com uma construção leve e actual.", preco: 3800, categoriaId: 1, imagem: image("photo-1512099053734-e6767b535838"), imagemModelo: image("photo-1751168488843-7add4ba9dc37"), disponivel: true, destaque: false, testeVirtual: false, imagemVirtual: "", criadoEm: "2026-09-09T10:30:00.000Z" },
    { id: 12, nome: "Costa do Sol", descricao: "Óculos de sol de linhas largas, concebidos para completar um visual descontraído.", preco: 4500, categoriaId: 2, imagem: image("photo-1650779404156-81d5ae10677b"), imagemModelo: image("photo-1529139574466-a303027c1d8b"), disponivel: true, destaque: true, testeVirtual: true, imagemVirtual: virtualFrame, criadoEm: "2026-09-10T11:40:00.000Z" },
  ];

  const promotions = [
    { id: 1, produtoId: 2, precoPromocional: 3400, dataInicial: isoDate(-8), dataFinal: isoDate(22), destaque: true, ativo: true, criadoEm: new Date().toISOString() },
    { id: 2, produtoId: 5, precoPromocional: 3990, dataInicial: isoDate(-4), dataFinal: isoDate(14), destaque: true, ativo: true, criadoEm: new Date().toISOString() },
    { id: 3, produtoId: 10, precoPromocional: 4500, dataInicial: isoDate(-40), dataFinal: isoDate(-10), destaque: false, ativo: true, criadoEm: new Date().toISOString() },
    { id: 4, produtoId: 12, precoPromocional: 3900, dataInicial: isoDate(5), dataFinal: isoDate(35), destaque: false, ativo: true, criadoEm: new Date().toISOString() },
  ];

  const appointments = [
    { id: 1, nomeCompleto: "Amélia Mucavele", contacto: "84 123 4567", tipoConsulta: "Avaliação visual", data: isoDate(2), horario: "10:00", observacoes: "Primeira visita.", estado: "Pendente", criadoEm: new Date().toISOString() },
    { id: 2, nomeCompleto: "Carlos Mondlane", contacto: "86 765 4321", tipoConsulta: "Ajuste de armação", data: isoDate(3), horario: "14:00", observacoes: "Ajuste das hastes.", estado: "Confirmada", criadoEm: new Date().toISOString() },
  ];

  const schedules = Array.from({ length: 7 }, (_, day) => ({
    diaSemana: day,
    ativo: true,
    abertura: "00:00",
    encerramento: "23:59",
    duracaoConsulta: 60,
  }));

  const configuration = {
    nomeOptica: "Óptica Excelente E.I.",
    slogan: "Visão Excelente",
    endereco: "Xipamanine, Maputo, Moçambique",
    latitude: -25.966213,
    longitude: 32.567451,
    telefone: "86 568 0167",
    whatsapp: "+258 85 320 6105",
    facebook: "https://www.facebook.com/profile.php?id=61578727894330",
    horarioTextual: "Sempre aberto",
    logo: new URL("../assets/images/logo/logo-transparente.png", import.meta.url).href,
  };

  return { categories, products, promotions, appointments, schedules, configuration, favorites: [], cart: [] };
}
