export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  readingTime: number;
  category: string;
  keywords: string[];
  content: string;
}

const posts: BlogPost[] = [
  {
    slug: "como-crear-menu-digital-restaurante-gratis",
    title: "Cómo crear un menú digital para tu restaurante gratis en 2025",
    description:
      "Guía paso a paso para tener tu carta online en minutos. Sin saber programar, sin costos en dólares, con pedidos directo a tu WhatsApp.",
    date: "2025-06-10",
    readingTime: 5,
    category: "Guías",
    keywords: [
      "menú digital restaurante gratis",
      "carta online restaurante argentina",
      "cómo crear menú digital",
      "carta digital gratis argentina",
    ],
    content: `
<h2>¿Qué es un menú digital y por qué lo necesita tu restaurante?</h2>
<p>Un menú digital es la versión online de tu carta física. Tus clientes pueden verlo desde el celular, elegir sus productos y mandarte el pedido directo por WhatsApp — sin descargar ninguna app.</p>
<p>La diferencia con plataformas como PedidosYa o Rappi es clave: <strong>el dinero llega directo a vos, sin comisión por cada venta</strong>. Con Takefyy pagás una suscripción mensual fija en pesos y listo.</p>

<h2>Lo que necesitás antes de empezar</h2>
<ul>
  <li>Nombre y logo de tu local (opcional al principio)</li>
  <li>Fotos de tus productos (con el celular alcanza)</li>
  <li>Lista de precios actualizada</li>
  <li>Número de WhatsApp donde recibís pedidos</li>
</ul>
<p>Eso es todo. No hace falta saber programar ni contratar a nadie.</p>

<h2>Paso 1: Creá tu cuenta en Takefyy</h2>
<p>Entrá a <strong>takefyy.com</strong> y hacé click en "Empezar gratis". Te pedimos un email y listo — sin tarjeta de crédito, sin datos de pago. Tenés 14 días de prueba gratuita para ver si te convence.</p>

<h2>Paso 2: Cargá tus categorías y productos</h2>
<p>Desde el panel admin organizás tu carta por categorías (Hamburguesas, Bebidas, Postres, etc.) y dentro de cada una cargás los productos con:</p>
<ul>
  <li><strong>Nombre</strong> del producto</li>
  <li><strong>Precio</strong> en pesos argentinos</li>
  <li><strong>Foto</strong> (podés subir desde el celular)</li>
  <li><strong>Descripción</strong> breve (ingredientes, tamaño, etc.)</li>
  <li><strong>Badges</strong>: Popular, Nuevo, Promo, Agotado</li>
</ul>

<h2>Paso 3: Personalizá los colores de tu carta</h2>
<p>En el plan Pro podés cargar tu logo y elegir los colores de tu marca. Tu menú va a tener la identidad de tu negocio, no la de Takefyy.</p>

<h2>Paso 4: Compartí el link</h2>
<p>Tu carta queda en <strong>takefyy.com/tu-local</strong>. Podés compartir ese link en WhatsApp, Instagram, Google Maps o imprimirlo en un código QR para las mesas.</p>
<p>Cuando un cliente elige sus productos y hace click en "Hacer pedido", te llega un mensaje de WhatsApp con el detalle completo: nombre, dirección y qué pidió. Sin intermediarios.</p>

<h2>¿Cuánto cuesta?</h2>
<p>Takefyy tiene un plan gratuito permanente con todas las funciones básicas. Para locales que quieren más, el plan Pro cuesta $17.000 ARS por mes — precio fijo en pesos, sin dólares, sin comisiones por venta.</p>

<h2>Conclusión</h2>
<p>Crear un menú digital para tu restaurante hoy es más fácil y barato que nunca. Con Takefyy lo tenés funcionando en menos de una hora, sin técnicos, sin contratos y sin comisiones que se coman tu ganancia.</p>
<p><strong>¿Listo para empezar?</strong> Probá Takefyy gratis durante 14 días.</p>
    `.trim(),
  },
  {
    slug: "pedidos-whatsapp-restaurante-vs-rappi-pedidosya",
    title:
      "Pedidos por WhatsApp vs. Rappi y PedidosYa: qué le conviene más a tu restaurante",
    description:
      "Comparativa honesta entre recibir pedidos por WhatsApp con Takefyy y usar plataformas de delivery como Rappi o PedidosYa. Comisiones, control y ganancia real.",
    date: "2025-06-05",
    readingTime: 6,
    category: "Comparativas",
    keywords: [
      "pedidos whatsapp restaurante",
      "whatsapp vs rappi restaurante",
      "alternativa rappi para restaurantes",
      "pedidos online sin comision argentina",
      "menú digital sin rappi",
    ],
    content: `
<h2>El problema de las plataformas de delivery</h2>
<p>Rappi, PedidosYa y apps similares resuelven un problema real: llevan clientes nuevos a tu puerta. Pero ese tráfico tiene un costo altísimo: <strong>comisiones de entre el 25% y el 35% por cada pedido</strong>.</p>
<p>En un negocio gastronómico donde el margen bruto ronda el 50-60%, esa comisión se lleva más de la mitad de tu ganancia. Y encima manejás el stock, cocinás y hacés el delivery — pero la plata pasa por ellos primero.</p>

<h2>¿Qué pasa cuando recibís pedidos por WhatsApp?</h2>
<p>Cuando usás un menú digital como Takefyy, el pedido llega directo a tu WhatsApp. No hay intermediario. No hay comisión por venta. El cliente te paga a vos.</p>
<p>La diferencia en números es brutal:</p>
<ul>
  <li><strong>Pedido de $10.000 por Rappi</strong>: te quedan ~$6.500 después de comisión</li>
  <li><strong>Pedido de $10.000 por WhatsApp</strong>: te quedan $10.000</li>
</ul>
<p>Con 50 pedidos al mes, la diferencia es de $175.000 ARS — más que el costo anual de Takefyy Pro.</p>

<h2>Cuándo tiene sentido usar Rappi o PedidosYa</h2>
<p>Seamos honestos: las plataformas de delivery sí tienen ventajas. Si tu local es nuevo y necesitás generar visibilidad, tener presencia en Rappi o PedidosYa puede ayudarte a atraer clientes que no te conocen todavía.</p>
<p>El problema es quedarte <em>solo</em> con esas plataformas para siempre, sin construir una base de clientes propios.</p>

<h2>La estrategia que funciona: las dos cosas</h2>
<p>Los locales que mejor les va usan las plataformas para conseguir clientes nuevos y su propio menú digital para fidelizar. El flow ideal es:</p>
<ol>
  <li>El cliente te encuentra por Rappi o PedidosYa</li>
  <li>Le compartís tu link de Takefyy para el próximo pedido</li>
  <li>El cliente compra directo por WhatsApp y vos te quedás con el 100% de la ganancia</li>
</ol>

<h2>Control total de tu negocio</h2>
<p>Con un menú digital propio tenés datos que las plataformas no te dan: qué productos son los más pedidos, a qué hora recibís más pedidos, cuánto gasta cada cliente en promedio. Esa información es tuya.</p>

<h2>Conclusión</h2>
<p>Rappi y PedidosYa son herramientas de adquisición, no de negocio a largo plazo. Un menú digital con Takefyy te da independencia, más ganancia por pedido y control total sobre tus datos y tus clientes.</p>
<p>Empezar es gratis. Sin tarjeta, sin contrato.</p>
    `.trim(),
  },
  {
    slug: "menu-digital-hamburguesia-guia-completa",
    title:
      "Menú digital para hamburgueserías: guía completa para recibir más pedidos",
    description:
      "Cómo armar el menú digital perfecto para tu hamburguesería. Tips de fotografía, cómo nombrar los productos, badges que aumentan ventas y más.",
    date: "2025-05-28",
    readingTime: 7,
    category: "Guías",
    keywords: [
      "menú digital hamburguesería",
      "carta digital hamburguesería argentina",
      "menú online hamburguesería gratis",
      "hamburguesería pedidos whatsapp",
      "cómo vender hamburguesas online argentina",
    ],
    content: `
<h2>Por qué una hamburguesería necesita un menú digital</h2>
<p>Las hamburgueserías son uno de los negocios que más se benefician de los pedidos online. El producto viaja bien, el ticket promedio es alto y los clientes están acostumbrados a pedir desde el celular.</p>
<p>El problema es depender de Rappi o PedidosYa, que se quedan con hasta el 35% de cada venta. Con un menú digital propio, ese porcentaje queda en tu bolsillo.</p>

<h2>Cómo estructurar el menú de tu hamburguesería</h2>
<p>La estructura que mejor convierte (más pedidos) en hamburgueserías tiene estas categorías en orden:</p>
<ol>
  <li><strong>Lo más pedido</strong> — los 3-4 favoritos de tus clientes, con foto grande</li>
  <li><strong>Hamburguesas</strong> — el core del negocio</li>
  <li><strong>Combos</strong> — hamburguesa + papas + bebida, ticket más alto</li>
  <li><strong>Extras</strong> — papas, aros, salsas</li>
  <li><strong>Bebidas</strong> — siempre al final</li>
</ol>
<p>En Takefyy podés marcar productos con el badge <em>"Más pedido"</em> para que aparezcan destacados automáticamente en base a tus ventas reales.</p>

<h2>El nombre de cada hamburguesa importa más de lo que creés</h2>
<p>Evitá nombres genéricos como "Hamburguesa Clásica" o "Burger Simple". Los nombres que mejor funcionan en hamburgueserías son:</p>
<ul>
  <li><strong>Nombres propios</strong>: "The Larry", "La Bestia", "La Reina"</li>
  <li><strong>Nombres que describen la experiencia</strong>: "Doble Cheddar Explosion", "Crispy Bacon Stack"</li>
</ul>
<p>Los nombres propios generan curiosidad y son más fáciles de recordar y recomendar.</p>

<h2>Fotografía de productos: lo que nadie te dice</h2>
<p>No necesitás una cámara profesional. Con el celular y estas reglas básicas alcanza:</p>
<ul>
  <li><strong>Luz natural</strong>: cerca de una ventana, sin flash</li>
  <li><strong>Fondo neutro</strong>: una tabla de madera o una servilleta de papel es suficiente</li>
  <li><strong>Foto desde arriba o en 45°</strong>: muestra mejor los ingredientes</li>
  <li><strong>Producto recién salido de la cocina</strong>: el queso derretido vende solo</li>
</ul>

<h2>Qué poner en la descripción de cada producto</h2>
<p>La descripción debe responder dos preguntas: <em>¿qué lleva?</em> y <em>¿cuánto es?</em>. Ejemplo:</p>
<blockquote>
  <p><em>"2 medallones de 100g, doble cheddar, bacon crocante, cebolla caramelizada y salsa de la casa. Pan brioche artesanal."</em></p>
</blockquote>
<p>Mencionar el peso de la carne genera confianza. Mencionar el pan artesanal justifica el precio.</p>

<h2>Badges que aumentan las ventas</h2>
<p>Takefyy te deja marcar cada producto con badges visibles en la carta:</p>
<ul>
  <li><strong>🔥 Popular</strong>: activa el efecto de prueba social — si otros lo piden, debe ser bueno</li>
  <li><strong>✨ Nuevo</strong>: genera curiosidad, los clientes quieren probar lo nuevo</li>
  <li><strong>🏷️ Promo</strong>: atrae la atención de quienes buscan precio</li>
</ul>
<p>Usá badges con criterio. Si todo es "Popular", nada lo es.</p>

<h2>Extras y personalización: el secreto del ticket alto</h2>
<p>Ofrecé extras en cada producto: doble cheddar, bacon extra, salsa especial. En Takefyy configurás extras con precio en cada producto y el cliente los elige antes de agregar al carrito.</p>
<p>Un cliente que agrega doble cheddar a su hamburguesa sube el ticket promedio en $800-$1.200 ARS por pedido sin ningún esfuerzo de tu parte.</p>

<h2>Conclusión</h2>
<p>Un menú digital bien armado puede duplicar los pedidos online de tu hamburguesería sin pagar comisiones a terceros. La clave está en la estructura del menú, los nombres, las fotos y los badges.</p>
<p>Takefyy te da todas esas herramientas. Empezá gratis hoy.</p>
<p><a href="/hamburgueserias">Ver todo sobre menú digital para hamburguerías →</a></p>
    `.trim(),
  },
  {
    slug: "como-tomar-fotos-productos-hamburguesas-celular",
    title:
      "Cómo tomar fotos de tus hamburguesas con el celular (sin ser fotógrafo)",
    description:
      "Guía práctica para sacar fotos que venden. Luz, ángulo, fondo y tips específicos para hamburguerías. Sin cámara profesional, sin editor.",
    date: "2025-06-18",
    readingTime: 4,
    category: "Guías",
    keywords: [
      "fotos hamburguesas celular",
      "fotografía producto hamburguesería",
      "cómo fotografiar hamburguesas",
      "fotos menú digital restaurante",
      "fotografía gastronómica celular argentina",
    ],
    content: `
<h2>Por qué las fotos son la clave de tu menú digital</h2>
<p>El 70% de la decisión de compra en un menú digital se toma en base a las fotos. Un cliente que ve una hamburguesa con queso derretido, bacon crocante y un pan brillante va a pedir antes que uno que ve solo texto con precio.</p>
<p>Buena noticia: no necesitás una cámara profesional. Solo algunas reglas básicas y tu celular.</p>

<h2>La regla número uno: luz natural siempre</h2>
<p>El flash del celular aplana la imagen y hace que la comida se vea plástica. Colocá la hamburguesa cerca de una ventana con luz indirecta. Hora ideal: mañana o tarde, nunca al mediodía con sol directo.</p>

<h2>Ángulos que funcionan para hamburguesas</h2>
<ul>
  <li><strong>45 grados (el clásico)</strong>: muestra las capas del relleno. Es el ángulo que más vende.</li>
  <li><strong>Desde arriba (flat lay)</strong>: funciona para mostrar el plato completo con papas y bebida.</li>
  <li><strong>A nivel (eye level)</strong>: para hamburguesas muy altas, muestra la altura impresionante.</li>
</ul>

<h2>El truco del queso derretido</h2>
<p>Fotografiá en los primeros 60 segundos después de armar la hamburguesa — después el queso solidifica. Si es necesario, usá un soplete antes de fotografiar para activar el derretido.</p>

<h2>Fondo: simple gana siempre</h2>
<ul>
  <li><strong>Tabla de madera oscura</strong>: da calidez y contrasta bien con la carne</li>
  <li><strong>Papel kraft o pergamino</strong>: look artesanal muy popular en hamburguerías</li>
  <li><strong>Pizarrón negro</strong>: moderno, hace destacar los colores del producto</li>
</ul>

<h2>Edición mínima, máximo impacto</h2>
<p>Con la app de fotos del celular alcanza: subí brillo 10-15%, contraste 10%, saturación 10% y un toque más de calidez. No más. Las fotos muy editadas se ven falsas.</p>

<h2>Conclusión</h2>
<p>Una hora fotografiando tus hamburguesas puede aumentar el ticket promedio de tu hamburguesería en un 20-30%. Takefyy te permite actualizar las fotos de tu menú cuando quieras, desde el celular.</p>
    `.trim(),
  },
  {
    slug: "aumentar-ventas-hamburgueseria-sin-rappi",
    title:
      "5 estrategias para aumentar las ventas de tu hamburguesería sin depender de Rappi",
    description:
      "Cómo generar más pedidos y fidelizar clientes en tu hamburguesería sin pagar comisiones a plataformas de delivery. Estrategias concretas para Argentina.",
    date: "2025-06-22",
    readingTime: 6,
    category: "Estrategias",
    keywords: [
      "aumentar ventas hamburguesería argentina",
      "estrategias hamburguesería sin rappi",
      "más pedidos hamburguesería whatsapp",
      "fidelizar clientes hamburguesería",
      "marketing hamburguesería argentina",
      "hamburguesería sin plataformas delivery",
    ],
    content: `
<h2>El problema de depender de Rappi</h2>
<p>Rappi y PedidosYa cobran hasta el 35% de cada pedido. En una hamburguesería con margen ajustado, eso puede comerse toda tu ganancia. Pero lo más peligroso es que <strong>esos clientes son de la plataforma, no tuyos</strong>.</p>

<h2>1. Instalá un menú digital con link propio</h2>
<p>El primer paso es tener una URL propia para tu hamburguesería: <strong>takefyy.com/tu-hamburgueria</strong>. Cuando un cliente pide por ese link, el pedido llega directo a tu WhatsApp y te quedás con el 100% de la venta.</p>

<h2>2. Convertí a tus clientes de Rappi en clientes directos</h2>
<p>Incluí en el packaging una tarjeta con tu link de Takefyy y un incentivo: <em>"La próxima vez pedí directo por WhatsApp y te regalamos unas papas."</em> Con 3 conversiones por semana, en un mes tenés decenas de clientes propios.</p>

<h2>3. Usá Instagram para llevar tráfico a tu menú</h2>
<p>Reemplazá el link en bio por tu URL de Takefyy. Publicá stories con el cheese pull y CTA "Pedí ahora". Los reels de preparación de hamburguesas generan alto engagement y tráfico real.</p>

<h2>4. Google Maps: el canal más subestimado</h2>
<p>Cuando alguien busca "hamburguesería cerca" aparece primero Google Maps. Asegurate de tener fotos actualizadas, horarios correctos y el link a tu menú digital en el campo "Sitio web". Es gratis y genera pedidos constantes.</p>

<h2>5. Lista de difusión de WhatsApp</h2>
<p>Armá una lista con tus clientes y usala para comunicar el menú de la semana, promos y productos nuevos. Una lista de 100 contactos puede generar 10-20 pedidos extra por semana sin costo adicional.</p>

<h2>Conclusión</h2>
<p>Con un menú digital propio, Instagram activo, Google Maps optimizado y una lista de difusión, podés construir una base de clientes que compra directo a vos — sin pagar comisiones a nadie.</p>
<p><a href="/hamburgueserias">Ver cómo crear el menú digital de tu hamburguesería →</a></p>
    `.trim(),
  },
];

export function getAllPosts(): BlogPost[] {
  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}
