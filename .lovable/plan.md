
## Plan de implementación (paso a paso)

### Fase 1: Sistema de progresión y desbloqueo
- Todos los niveles bloqueados excepto el 1
- Al completar un nivel se desbloquea el siguiente
- Guardar progreso en localStorage

### Fase 2: Sistema de estrellas (1-3)
- 3 vidas restantes = 3 estrellas, 2 vidas = 2 estrellas, 1 vida = 1 estrella
- Mostrar estrellas al completar nivel y en el selector de niveles
- Guardar mejor puntuación por nivel

### Fase 3: Sistema de monedas y recompensas
- Monedas = estrellas × nivel (nivel 1: 1-3 monedas, nivel 2: 2-6 monedas, etc.)
- Solo se ganan monedas si superas tu récord de estrellas en ese nivel
- 3 estrellas = nivel bloqueado para más monedas
- Mostrar monedas totales en la UI

### Fase 4: Tienda de skins
- Skins clasificadas: Común, Rara, Épica, Legendaria
- Precios escalados por rareza
- ~20+ skins con colores/formas diferentes
- Sistema de selección de skin activa
- Renderizar skin seleccionada en el juego

### Fase 5: Plataformas sólidas
- Plataformas en el aire donde puedes subirte
- Colisión por arriba: no puedes traspasar plataformas superiores
- Integrar en el generador de niveles

### Fase 6: Nuevas trampas cada 10 niveles
- Nivel 10+: Sierra móvil vertical
- Nivel 20+: Bloques que desaparecen
- Nivel 30+: Seta de inmunidad (5 segundos)
- Nivel 40+: Láseres pulsantes
- Nivel 50+: Martillos giratorios

### Fase 7: Modo bola (nivel 50+)
- Modo donde el jugador es una bola que rueda
- Física diferente (gravedad invertida con click)
- Activado en algunos niveles a partir del 50

### Fase 8: Modo avión (nivel 70+)
- El jugador vuela, mantener click = subir, soltar = bajar
- Pinchos arriba y abajo, espacios estrechos
- Obligatorio en ciertas secciones del nivel

### Fase 9: Niveles predeterminados ajustados a música
- Los niveles son fijos (mismos obstáculos siempre para el mismo nivel)
- Se escalan/ajustan al tempo de la canción seleccionada

---

**Nota:** Cada fase se implementará y verificará antes de pasar a la siguiente. ¿Apruebas el plan para empezar?
