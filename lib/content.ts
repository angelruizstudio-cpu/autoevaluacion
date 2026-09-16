/* =====================================================================
   Contenido bilingue y modelo de puntuacion.
   Fuente unica de verdad: el cliente lo usa para render, el servidor
   lo usa para revalidar el puntaje. Nunca confies en los porcentajes
   que manda el navegador: se recalculan en /api/enviar con este mismo
   archivo, a partir de las respuestas crudas.
===================================================================== */

export type Lang = "es" | "en";
export type StyleId =
  | "directivo" | "visionario" | "afiliativo"
  | "democratico" | "ejemplar" | "formativo";

export const ORDER: StyleId[] = [
  "directivo", "visionario", "afiliativo", "democratico", "ejemplar", "formativo"
];

export const COLORS: Record<StyleId, string> = {
  directivo: "#A4343A", visionario: "#1F4E79", afiliativo: "#C08428",
  democratico: "#4B7F52", ejemplar: "#6E4C93", formativo: "#1F7A78"
};

export const ITEM_STYLE: StyleId[] = ["directivo","visionario","afiliativo","democratico","ejemplar","formativo",
  "directivo","visionario","afiliativo","democratico","ejemplar","formativo",
  "directivo","visionario","afiliativo","democratico","ejemplar","formativo",
  "directivo","visionario","afiliativo","democratico","ejemplar","formativo",
  "directivo","visionario","afiliativo","democratico","ejemplar","formativo"];

/** Solo las claves que son funciones: asi TS infiere sus parametros en
 *  los dos idiomas. El resto del contenido queda suelto a proposito. */
type Textos = {
  counter: (a: number, b: number) => string;
  resHead: (n: string) => string;
  resSub: (m: string, n: string) => string;
  repMany: (n: number) => string;
  repSome: (n: number) => string;
  lowest: (n: string, p: number, w: string) => string;
  watch: (r: string) => string;
  [clave: string]: any;
};

export const CONTENT: Record<Lang, Textos> = {
es:{
  docTitle:"Seis maneras de dirigir — Autoevaluación de liderazgo",
  barTitle:"Autoevaluación de liderazgo",
  heroTitle:'Seis maneras de <em>dirigir</em>',
  heroLede:"Ningún líder usa un solo estilo. Este cuestionario mide cuánto recurres a cada uno de los seis estilos de liderazgo descritos por Daniel Goleman, aplicados al trabajo de iglesia y ministerio.",
  meta:[["30","afirmaciones"],["6","estilos medidos"],["7","minutos aprox."]],
  heroNote:"Responde según lo que <strong>realmente haces</strong> hoy, no según lo que te gustaría hacer. No hay estilos buenos ni malos: hay estilos oportunos y estilos fuera de lugar.",
  start:"Comenzar la evaluación",
  scaleNote:"¿Con cuánta frecuencia te describe?",
  scale:["Nunca","Rara vez","A veces","Con frecuencia","Casi siempre"],
  counter:(a,b)=>`Afirmación ${a} de ${b}`,
  back:"← Afirmación anterior",
  resHead:n=>`Tu estilo dominante es el ${n.toLowerCase()}`,
  resSub:(m,n)=>`${m} Le sigue de cerca el estilo ${n.toLowerCase()}.`,
  secBars:"Tu perfil, estilo por estilo",
  secBarsNote:"El porcentaje indica cuánto usas ese estilo, no qué tan bien lo haces.",
  secCards:"Qué hacer con cada estilo",
  secCardsNote:"Toca cada estilo para ver cuándo conviene usarlo, qué riesgo trae y cómo se ve en el ministerio.",
  lblWhat:"En qué consiste", lblWhen:"Cuándo conviene usarlo", lblRisk:"Qué riesgo trae",
  print:"Guardar o imprimir", again:"Repetir la evaluación",
  repMany:n=>`Tienes <span class="tag">${n} estilos activos</span>. Ese es el rango más amplio: puedes cambiar de registro según lo que la situación pida, que es exactamente lo que distingue a los líderes más eficaces.`,
  repSome:n=>`Tienes <span class="tag">${n} estilos activos</span>. Te mueves con soltura, pero todavía hay registros que casi no usas. Ampliar a cuatro es la meta que vale la pena.`,
  repOne:`Tienes <span class="tag">un solo estilo activo</span>. Eso funciona mientras la situación no cambie; cuando cambia, un repertorio estrecho se siente como rigidez. Empieza por practicar uno de los estilos bajos.`,
  lowest:(n,p,w)=>`El estilo que menos usas es el <span class="tag">${n.toLowerCase()}</span> (${p} %). No es un defecto: es la próxima herramienta que te conviene practicar. ${w}`,
  watch:r=>`Y ojo con el riesgo de tu estilo dominante: ${r.charAt(0).toLowerCase()+r.slice(1)}`,
  styles:{
    directivo:{name:"Directivo",motto:"«Hagan esto, y háganlo ahora.»",
      what:"Marcas el rumbo con instrucciones claras y esperas cumplimiento inmediato. Decides rápido y asumes la responsabilidad de la decisión.",
      when:"Crisis reales, emergencias, conflictos que se salieron de control, o un equipo nuevo que todavía no sabe qué se espera de él.",
      risk:"Usado como norma y no como excepción, apaga la iniciativa, crea dependencia del líder y hace que la gente deje de traer problemas por miedo a la reacción.",
      scripture:"Nehemías no convocó una asamblea cuando vio el muro caído: inspeccionó de noche, habló claro y repartió tramos. La urgencia justificó la firmeza; la reconstrucción la compartió con todos."},
    visionario:{name:"Visionario",motto:"«Vengan conmigo.»",
      what:"Pintas el destino con claridad y dejas que cada quien encuentre su camino hacia allá. Conectas la tarea pequeña con el propósito grande.",
      when:"Cambios de rumbo, proyectos nuevos, equipos desanimados o dispersos que necesitan recordar por qué están sirviendo.",
      risk:"Se queda en palabras si no hay credibilidad detrás, o si el equipo conoce el terreno mejor que tú y siente que la visión ignora la realidad.",
      scripture:"«Escribe la visión, y decláradla en tablas, para que corra el que leyere en ella» (Habacuc 2:2). La visión escrita corre sola; la que solo vive en la cabeza del líder se detiene con él."},
    afiliativo:{name:"Afiliativo",motto:"«Primero la persona.»",
      what:"Cuidas la relación antes que la tarea. Conoces las cargas de tu gente, celebras lo bueno y trabajas por mantener la unidad del equipo.",
      when:"Después de una pérdida o un conflicto, cuando hay que reconstruir confianza, o con voluntarios cansados que necesitan sentirse vistos.",
      risk:"Solo, deja el bajo rendimiento sin corregir. La armonía se vuelve más importante que la verdad y los problemas se acumulan sin nombrarse.",
      scripture:"«El buen pastor su vida da por las ovejas... y las llama por nombre» (Juan 10). Conocer por nombre es el piso del pastoreo, pero el mismo pastor usa la vara para corregir el rumbo."},
    democratico:{name:"Democrático",motto:"«¿Qué opinan ustedes?»",
      what:"Construyes consenso. Consultas, escuchas posiciones distintas a la tuya y dejas que la decisión salga del grupo.",
      when:"Decisiones que afectan a todos, cuando necesitas compromiso genuino, o cuando el equipo tiene más información que tú sobre el asunto.",
      risk:"Reuniones interminables, decisiones postergadas y equipos confundidos. En crisis, consultar demasiado se lee como falta de dirección.",
      scripture:"En Hechos 6 los apóstoles definieron el criterio y la congregación escogió a los siete. Consenso con marco claro: no todo se vota, pero lo que se vota se respeta."},
    ejemplar:{name:"Ejemplar",motto:"«Háganlo como yo, y rápido.»",
      what:"Marcas el estándar con tu propio desempeño. Exiges mucho, trabajas más que nadie y esperas el mismo nivel de los demás.",
      when:"Equipos pequeños, capaces y motivados que necesitan un empujón de excelencia en un plazo corto.",
      risk:"Es el estilo que más quema gente. Delegas poco, absorbes las tareas de otros y el equipo termina agotado o sintiéndose insuficiente. También te convierte en cuello de botella.",
      scripture:"«Sed imitadores de mí, así como yo de Cristo» (1 Corintios 11:1). El ejemplo se ofrece como modelo, no se impone como vara de medir a los que apenas empiezan."},
    formativo:{name:"Formativo",motto:"«Prueba esto y hablamos.»",
      what:"Inviertes tiempo en desarrollar personas. Das retroalimentación específica, asignas tareas que hacen crecer y preguntas más de lo que respondes.",
      when:"Casi siempre, y especialmente con gente dispuesta a crecer. Es el estilo menos usado y el de mayor retorno a largo plazo.",
      risk:"Es lento. No sirve en medio de una crisis, ni con alguien que se resiste a aprender o que está en el rol equivocado.",
      scripture:"«Lo que has oído de mí... esto encarga a hombres fieles que sean idóneos para enseñar también a otros» (2 Timoteo 2:2). Cuatro generaciones en un solo versículo: el discipulado es el plan de sucesión."}
  },
  items:[
    "Cuando hay urgencia, doy instrucciones directas y espero que se cumplan sin discusión.",
    "Explico con claridad hacia dónde vamos y por qué vale la pena llegar allá.",
    "Antes de hablar de tareas, pregunto cómo está la persona.",
    "Consulto al equipo antes de tomar decisiones importantes.",
    "Pongo el ejemplo trabajando más duro que cualquiera del equipo.",
    "Dedico tiempo a desarrollar personas aunque eso atrase el trabajo.",
    "Me incomoda que se cuestionen decisiones que ya tomé.",
    "Conecto las tareas del día con el propósito mayor del ministerio.",
    "Estoy pendiente de las cargas personales de quienes sirven conmigo.",
    "Busco activamente opiniones distintas a la mía.",
    "Me cuesta delegar porque siento que lo haré mejor y más rápido.",
    "Doy retroalimentación específica sobre fortalezas y áreas de crecimiento.",
    "Si el equipo se desvía, corrijo de inmediato y retomo el control yo mismo.",
    "La gente sale de mis reuniones sabiendo hacia dónde vamos.",
    "Celebro y afirmo a mi gente con frecuencia.",
    "Someto a consenso los asuntos que afectan a todo el equipo.",
    "Espero de los demás el mismo nivel de exigencia que me impongo a mí.",
    "Asigno responsabilidades pensando en lo que harán crecer a la persona.",
    "Prefiero decidir rápido aunque no todos estén de acuerdo.",
    "Doy libertad en el «cómo» mientras el «hacia dónde» esté claro.",
    "Evito confrontaciones que puedan dañar la relación.",
    "En las reuniones escucho más de lo que hablo.",
    "Cuando alguien se queda corto, termino haciendo la tarea yo.",
    "Hago preguntas para que la persona encuentre su propia respuesta.",
    "Le recuerdo al equipo las consecuencias de no cumplir con lo asignado.",
    "Hablo del futuro del ministerio con convicción y lo hago concreto.",
    "Cuido la armonía del grupo como una de mis prioridades.",
    "Acepto que una decisión tome más tiempo si así todos la hacen suya.",
    "Mis estándares de excelencia son altos y poco negociables.",
    "Converso con mi equipo sobre sus metas personales, no solo las del ministerio."
  ]
},
en:{
  docTitle:"Six ways to lead — Leadership self-assessment",
  barTitle:"Leadership self-assessment",
  heroTitle:'Six ways to <em>lead</em>',
  heroLede:"No leader uses just one style. This questionnaire measures how much you draw on each of the six leadership styles described by Daniel Goleman, applied to church and ministry work.",
  meta:[["30","statements"],["6","styles measured"],["7","minutes or so"]],
  heroNote:"Answer based on what you <strong>actually do</strong> today, not what you wish you did. There are no good or bad styles — only styles that fit the moment and styles that don't.",
  start:"Start the assessment",
  scaleNote:"How often does this describe you?",
  scale:["Never","Rarely","Sometimes","Often","Almost always"],
  counter:(a,b)=>`Statement ${a} of ${b}`,
  back:"← Previous statement",
  resHead:n=>`Your dominant style is ${n.toLowerCase()}`,
  resSub:(m,n)=>`${m} Close behind is your ${n.toLowerCase()} style.`,
  secBars:"Your profile, style by style",
  secBarsNote:"The percentage shows how much you use that style, not how well you do it.",
  secCards:"What to do with each style",
  secCardsNote:"Tap each style to see when it fits, what risk it carries, and how it looks in ministry.",
  lblWhat:"What it is", lblWhen:"When it fits", lblRisk:"What it risks",
  print:"Save or print", again:"Take it again",
  repMany:n=>`You have <span class="tag">${n} active styles</span>. That's the widest range there is: you can switch registers as the situation asks, which is exactly what sets the most effective leaders apart.`,
  repSome:n=>`You have <span class="tag">${n} active styles</span>. You move with some flexibility, but there are registers you barely touch. Getting to four is the goal worth chasing.`,
  repOne:`You have <span class="tag">one active style</span>. That works as long as the situation stays the same; when it changes, a narrow range reads as rigidity. Start by practicing one of your low styles.`,
  lowest:(n,p,w)=>`Your least-used style is <span class="tag">${n.toLowerCase()}</span> (${p}%). That's not a flaw — it's the next tool worth practicing. ${w}`,
  watch:r=>`And watch the risk your dominant style carries: ${r.charAt(0).toLowerCase()+r.slice(1)}`,
  styles:{
    directivo:{name:"Commanding",motto:"\u201cDo this, and do it now.\u201d",
      what:"You set direction with clear instructions and expect immediate compliance. You decide fast and carry the weight of the decision yourself.",
      when:"Genuine crises, emergencies, conflicts that have gotten out of hand, or a brand-new team that doesn't yet know what's expected.",
      risk:"Used as the rule rather than the exception, it shuts down initiative, breeds dependence on the leader, and teaches people to stop bringing you problems for fear of the reaction.",
      scripture:"Nehemiah didn't call an assembly when he saw the broken wall: he inspected it at night, spoke plainly, and assigned sections. Urgency justified the firmness; the rebuilding he shared with everyone."},
    visionario:{name:"Visionary",motto:"\u201cCome with me.\u201d",
      what:"You paint the destination clearly and let each person find their own way there. You connect the small task to the larger purpose.",
      when:"Changes of direction, new projects, discouraged or scattered teams that need to remember why they're serving.",
      risk:"It stays mere words without credibility behind it, or when the team knows the ground better than you and feels the vision ignores reality.",
      scripture:"\u201cWrite the vision, and make it plain upon tables, that he may run that readeth it\u201d (Habakkuk 2:2). A written vision runs on its own; one that lives only in the leader's head stops when he does."},
    afiliativo:{name:"Affiliative",motto:"\u201cPeople first.\u201d",
      what:"You tend the relationship before the task. You know what your people are carrying, you celebrate what's good, and you work to keep the team together.",
      when:"After a loss or a conflict, when trust needs rebuilding, or with tired volunteers who need to feel seen.",
      risk:"On its own, it leaves poor performance uncorrected. Harmony becomes more important than truth, and problems pile up unnamed.",
      scripture:"\u201cThe good shepherd giveth his life for the sheep... and he calleth his own sheep by name\u201d (John 10). Knowing them by name is the floor of shepherding — but the same shepherd carries a rod to correct the course."},
    democratico:{name:"Democratic",motto:"\u201cWhat do you all think?\u201d",
      what:"You build consensus. You consult, you listen to positions unlike your own, and you let the decision come from the group.",
      when:"Decisions that affect everyone, when you need genuine buy-in, or when the team knows more about the matter than you do.",
      risk:"Endless meetings, postponed decisions, confused teams. In a crisis, too much consulting reads as a lack of direction.",
      scripture:"In Acts 6 the apostles set the criteria and the congregation chose the seven. Consensus inside a clear frame: not everything goes to a vote, but what does gets honored."},
    ejemplar:{name:"Pacesetting",motto:"\u201cDo it like me, and fast.\u201d",
      what:"You set the standard with your own performance. You demand a lot, you outwork everyone, and you expect the same level from others.",
      when:"Small, capable, motivated teams that need a push toward excellence over a short stretch.",
      risk:"This is the style that burns people out fastest. You delegate little, absorb others' tasks, and the team ends up exhausted or feeling inadequate. It also makes you the bottleneck.",
      scripture:"\u201cBe ye followers of me, even as I also am of Christ\u201d (1 Corinthians 11:1). The example is offered as a model, not imposed as a measuring rod on those who are just starting."},
    formativo:{name:"Coaching",motto:"\u201cTry this, then let's talk.\u201d",
      what:"You invest time developing people. You give specific feedback, assign tasks that stretch them, and ask more than you answer.",
      when:"Almost always, and especially with people willing to grow. It's the least-used style and the one with the highest long-term return.",
      risk:"It's slow. It doesn't work mid-crisis, or with someone resisting learning, or with someone in the wrong role altogether.",
      scripture:"\u201cThe things that thou hast heard of me... the same commit thou to faithful men, who shall be able to teach others also\u201d (2 Timothy 2:2). Four generations in one verse: discipleship is the succession plan."}
  },
  items:[
    "When things are urgent, I give direct instructions and expect them followed without debate.",
    "I explain clearly where we're going and why it's worth getting there.",
    "Before talking about tasks, I ask how the person is doing.",
    "I consult the team before making important decisions.",
    "I set the example by outworking anyone on the team.",
    "I spend time developing people even when it slows the work down.",
    "It bothers me when decisions I've already made get questioned.",
    "I connect today's tasks to the larger purpose of the ministry.",
    "I keep track of the personal burdens of those serving with me.",
    "I actively seek out opinions different from my own.",
    "I struggle to delegate because I feel I'll do it better and faster.",
    "I give specific feedback on strengths and areas for growth.",
    "If the team drifts, I correct it right away and take the reins myself.",
    "People leave my meetings knowing where we're headed.",
    "I celebrate and affirm my people often.",
    "I bring matters that affect the whole team to consensus.",
    "I expect from others the same level of demand I place on myself.",
    "I assign responsibilities based on what will stretch the person.",
    "I'd rather decide quickly even if not everyone agrees.",
    "I give freedom on the \u201chow\u201d as long as the \u201cwhere to\u201d is clear.",
    "I avoid confrontations that could damage the relationship.",
    "In meetings I listen more than I speak.",
    "When someone falls short, I end up doing the task myself.",
    "I ask questions so the person finds their own answer.",
    "I remind the team of the consequences of not delivering what was assigned.",
    "I speak about the ministry's future with conviction and make it concrete.",
    "Keeping the group in harmony is one of my priorities.",
    "I accept that a decision takes longer if that's how everyone owns it.",
    "My standards of excellence are high and not very negotiable.",
    "I talk with my team about their personal goals, not just the ministry's."
  ]
}
};
