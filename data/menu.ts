export const WHATSAPP_NUMBER = '5492994130648'
export const RESTAURANT_NAME = "Riqq's Burgers"
export const SLOGAN = 'Amor a primera mordida'
export const INSTAGRAM = 'riqqsburgers'

export interface MenuItem {
  id: number
  nombre: string
  descripcion: string
  precio: number  // TODO: actualizar precios reales de burgers
  categoria: 'Burgers' | 'Promos' | 'Bebidas'
  tag?: string
}

export const CATEGORIAS = ['Burgers', 'Promos', 'Bebidas'] as const

export const MENU: MenuItem[] = [
  // ── Burgers ──────────────────────────────────────────────────────────────
  {
    id: 1,
    nombre: 'AMERICAN',
    descripcion: 'Medallón de 110g, cheddar, tomate, lechuga y cebolla morada encurtida',
    precio: 9500,
    categoria: 'Burgers',
  },
  {
    id: 2,
    nombre: 'BACON',
    descripcion: 'Medallón de 110g, cheddar, panceta ahumada y aderezo especial Riqq\'s',
    precio: 10500,
    categoria: 'Burgers',
    tag: '🔥 Popular',
  },
  {
    id: 3,
    nombre: 'PALTUM',
    descripcion: 'Medallón de 110g, cheddar, panceta ahumada y palta',
    precio: 11000,
    categoria: 'Burgers',
  },
  {
    id: 4,
    nombre: 'CHEESE',
    descripcion: 'Medallón de 110g, cebolla picada, ketchup y mostaza',
    precio: 8500,
    categoria: 'Burgers',
  },

  // ── Promos ───────────────────────────────────────────────────────────────
  {
    id: 5,
    nombre: 'Promo CHEESE',
    descripcion: '2 Cheese burgers + papas fritas',
    precio: 31000,
    categoria: 'Promos',
    tag: '🤑 Ahorrá',
  },

  // ── Bebidas ──────────────────────────────────────────────────────────────
  { id: 6, nombre: 'Coca-Cola Lata 354ml', descripcion: '', precio: 3000, categoria: 'Bebidas' },
  { id: 7, nombre: 'Sprite Lata 354ml', descripcion: '', precio: 3000, categoria: 'Bebidas' },
  { id: 8, nombre: 'Fanta Lata 354ml', descripcion: '', precio: 3000, categoria: 'Bebidas' },
  { id: 9, nombre: 'Aquarius Pera 500ml', descripcion: '', precio: 3000, categoria: 'Bebidas' },
  { id: 10, nombre: 'Aquarius Uva 500ml', descripcion: '', precio: 3000, categoria: 'Bebidas' },
  { id: 11, nombre: 'Aquarius Pomelo 500ml', descripcion: '', precio: 3000, categoria: 'Bebidas' },
]
