import type { AnalysisView, Block, ConceptView, DiagramView, FindingView, Summary } from "@/types/analysis-view";
import { prepareDemoQuestions, toPublicQuestion, type DemoQuestionInput } from "./quiz";

/**
 * PRE-COMPUTED analysis shown on the landing page without an account and without calling the LLM.
 * It uses exactly the view model of a real analysis, so the same viewer renders it (checked in the tests).
 * Its texts are content, not UI strings, so they live here and not in the message catalogue.
 */

const LINES = [
  "// Reintenta peticiones HTTP con espera exponencial",
  "async function fetchWithRetry(url, options = {}, retries = 3, delay = 500) {",
  "  for (let attempt = 0; attempt <= retries; attempt++) {",
  "    try {",
  "      const response = await fetch(url, options);",
  "      if (!response.ok) {",
  "        throw new Error(`HTTP ${response.status}`);",
  "      }",
  "      return await response.json();",
  "    } catch (error) {",
  "      if (attempt === retries) {",
  "        throw error;",
  "      }",
  "      const wait = delay * 2 ** attempt;",
  "      await new Promise((resolve) => setTimeout(resolve, wait));",
  "    }",
  "  }",
  "}",
  "",
  "const cache = new Map();",
  "",
  "function memoizeAsync(fn) {",
  "  return async function (key, ...args) {",
  "    if (cache.has(key)) {",
  "      return cache.get(key);",
  "    }",
  "    const promise = fn(...args).catch((err) => {",
  "      cache.delete(key);",
  "      throw err;",
  "    });",
  "    cache.set(key, promise);",
  "    return promise;",
  "  };",
  "}",
  "",
  "const getUser = memoizeAsync((id) =>",
  "  fetchWithRetry(`https://api.example.com/users/${id}`)",
  ");",
];

export const DEMO_CODE = LINES.join("\n");

export const DEMO_SUMMARY: Summary = {
  purpose:
    "Define un cliente HTTP resistente a fallos y una caché en memoria. `fetchWithRetry` repite una petición que falla esperando cada vez el doble de tiempo; `memoizeAsync` guarda las promesas ya pedidas para no repetir llamadas idénticas; y `getUser` combina ambas para consultar usuarios de una API.",
  inputs: [
    "`url` (string): dirección a consultar",
    "`options` (objeto, opcional): opciones de `fetch` como método, cabeceras o cuerpo",
    "`retries` (número, 3 por defecto) y `delay` (ms, 500 por defecto): controlan los reintentos",
    "`id` (usuario) que recibe `getUser`",
  ],
  outputs: [
    "Una promesa que resuelve con el JSON de la respuesta",
    "Lanza el último error si se agotan los reintentos",
    "Efecto secundario: llena el `Map` global `cache`",
  ],
  dependencies: [
    "`fetch` (API nativa del navegador y de Node 18+)",
    "`Map`, `Promise` y `setTimeout` (JavaScript estándar, sin librerías externas)",
    "API remota `https://api.example.com` (ejemplo)",
  ],
};

export const DEMO_BLOCKS: Block[] = [
  {
    lineStart: 1,
    lineEnd: 2,
    title: "Función con parámetros por defecto",
    explanation:
      "Declara `fetchWithRetry` como función `async`, así que devuelve una promesa y puede usar `await`. Los parámetros con valor por defecto hacen que solo `url` sea obligatorio: por defecto reintenta 3 veces y espera 500 ms.",
  },
  {
    lineStart: 3,
    lineEnd: 4,
    title: "Bucle de intentos",
    explanation:
      "Recorre `attempt` desde 0 hasta `retries` incluido, es decir, hace 1 intento inicial más 3 reintentos (4 en total). El `try` agrupa todo lo que puede fallar en cada vuelta.",
  },
  {
    lineStart: 5,
    lineEnd: 9,
    title: "Petición y validación de la respuesta",
    explanation:
      "Llama a `fetch` y espera la respuesta. Ojo: `fetch` NO falla con errores HTTP como 404 o 500 (solo con errores de red), por eso se comprueba `response.ok` a mano y se lanza un `Error` propio. Si todo va bien, devuelve el cuerpo ya convertido a JSON.",
  },
  {
    lineStart: 10,
    lineEnd: 13,
    title: "Último intento: propagar el error",
    explanation:
      "Cualquier fallo del bloque `try` cae aquí. Si ya era el último intento (`attempt === retries`) vuelve a lanzar el error para que lo maneje quien llamó a la función. Si no, sigue hacia la espera.",
  },
  {
    lineStart: 14,
    lineEnd: 15,
    title: "Espera exponencial (backoff)",
    explanation:
      "Calcula la espera como `delay * 2 ** attempt`: 500 ms, 1 s, 2 s... Esto evita saturar un servidor que ya está fallando. `new Promise` + `setTimeout` es el truco habitual para hacer una pausa que se pueda `await`ar.",
  },
  {
    lineStart: 16,
    lineEnd: 18,
    title: "Cierre del bucle y de la función",
    explanation:
      "Cierra el `try/catch`, el `for` y la función. En la práctica nunca se llega al final sin `return` ni `throw`: el último intento siempre hace una de las dos cosas.",
  },
  {
    lineStart: 20,
    lineEnd: 20,
    title: "Caché global",
    explanation:
      "Crea un `Map` a nivel de módulo que guardará los resultados por clave. Al ser global vive mientras viva el módulo y se comparte entre todas las llamadas.",
  },
  {
    lineStart: 22,
    lineEnd: 23,
    title: "Función de orden superior",
    explanation:
      "`memoizeAsync` recibe una función `fn` y devuelve otra función. La función devuelta recuerda (`closure`) tanto `fn` como `cache`, aunque `memoizeAsync` ya haya terminado de ejecutarse. Eso es lo que permite reutilizar la caché en cada llamada.",
  },
  {
    lineStart: 24,
    lineEnd: 26,
    title: "Acierto de caché",
    explanation:
      "Si la clave ya está en el `Map`, devuelve lo guardado. Lo guardado es una PROMESA, no el valor final: si dos llamadas piden lo mismo a la vez, ambas comparten la misma petición en curso en lugar de lanzar dos.",
  },
  {
    lineStart: 27,
    lineEnd: 30,
    title: "Guardar la promesa y limpiar si falla",
    explanation:
      "Ejecuta `fn` y engancha un `.catch`: si falla, borra la clave de la caché y relanza el error. Sin esto, un error temporal quedaría cacheado para siempre y todas las llamadas siguientes fallarían.",
  },
  {
    lineStart: 31,
    lineEnd: 34,
    title: "Registrar y devolver la promesa",
    explanation:
      "Guarda la promesa en la caché y la devuelve. Se guarda inmediatamente (sin esperar a que termine) para que las llamadas concurrentes del bloque anterior ya la encuentren.",
  },
  {
    lineStart: 36,
    lineEnd: 38,
    title: "Uso: getUser",
    explanation:
      "Compone las dos piezas: `getUser(id)` consulta la API con reintentos y, gracias a `memoizeAsync`, solo lo hace una vez por `id` mientras la petición tenga éxito. Atención: la caché no expira ni tiene límite de tamaño, algo a vigilar en producción.",
  },
];

const FLOW_DIAGRAM = {
  title: "Flujo de fetchWithRetry",
  mermaid: `flowchart TD
  A(["Inicio: fetchWithRetry(url)"]) --> B["attempt = 0"]
  B --> C{"attempt <= retries?"}
  C -->|"sí"| D["fetch(url, options)"]
  D --> E{"response.ok?"}
  E -->|"sí"| F(["Devuelve response.json()"])
  E -->|"no"| G["Lanza Error HTTP"]
  G --> H{"attempt === retries?"}
  H -->|"sí"| I(["Propaga el error"])
  H -->|"no"| J["Espera delay * 2^attempt"]
  J --> K["attempt++"]
  K --> C
  C -->|"no"| L(["Fin"])`,
};

const SEQUENCE_DIAGRAM = {
  title: "Qué pasa al llamar a getUser",
  mermaid: `sequenceDiagram
  participant App as Aplicación
  participant M as getUser memoizado
  participant C as cache Map
  participant F as fetchWithRetry
  participant API as api.example.com
  App->>M: getUser(7)
  M->>C: has(7)
  alt ya está en caché
    C-->>M: promesa guardada
  else no está
    M->>F: fetchWithRetry(url)
    M->>C: set(7, promesa)
    loop hasta 4 intentos con espera creciente
      F->>API: GET /users/7
      API-->>F: respuesta HTTP
    end
    F-->>M: JSON del usuario o error
  end
  M-->>App: promesa con el usuario`,
};

export const DEMO_CONCEPTS: ConceptView[] = [
  {
    name: "async/await",
    explanation: "Permite escribir código asíncrono como si fuera secuencial: `await` pausa la función hasta que la promesa de `fetch` se resuelve, sin bloquear el resto del programa.",
    lineStart: 2,
    lineEnd: 5,
  },
  {
    name: "try/catch",
    explanation: "Captura los errores lanzados dentro del bloque `try` (de red o el `throw` del estado HTTP) para decidir si se reintenta o se propaga el error.",
    lineStart: 4,
    lineEnd: 10,
  },
  {
    name: "Plantillas de texto",
    explanation: "Las comillas invertidas permiten insertar valores con `${...}` dentro de un texto, como el código de estado HTTP o el `id` en la URL.",
    lineStart: 7,
    lineEnd: 7,
  },
  {
    name: "Backoff exponencial",
    explanation: "Estrategia de reintentos en la que cada espera duplica la anterior (500, 1000, 2000 ms...) para no saturar un servidor que está fallando.",
    lineStart: 14,
    lineEnd: 15,
  },
  {
    name: "Promesas",
    explanation: "Objetos que representan un valor futuro. `new Promise` con `setTimeout` crea una pausa que se puede esperar con `await`.",
    lineStart: 15,
    lineEnd: 15,
  },
  {
    name: "Map",
    explanation: "Colección clave-valor nativa de JavaScript. Aquí guarda una promesa por cada clave ya pedida; `has`, `get`, `set` y `delete` la consultan y modifican.",
    lineStart: 20,
    lineEnd: 20,
  },
  {
    name: "Closures",
    explanation: "La función que devuelve `memoizeAsync` recuerda `fn` aunque `memoizeAsync` ya haya terminado: cada función memoizada lleva consigo su propia `fn`.",
    lineStart: 22,
    lineEnd: 33,
  },
  {
    name: "Memoización",
    explanation: "Guardar el resultado de una llamada para reutilizarlo cuando se repiten los mismos argumentos. Guardar la promesa (y no el valor) evita peticiones duplicadas simultáneas.",
    lineStart: 23,
    lineEnd: 32,
  },
  {
    name: "Parámetros rest y spread",
    explanation: "`...args` agrupa los argumentos restantes en un arreglo y `fn(...args)` los vuelve a separar al llamar a la función original.",
    lineStart: 23,
    lineEnd: 27,
  },
];

export const DEMO_FINDINGS: FindingView[] = [
  {
    kind: "BAD_PRACTICE",
    severity: "MEDIUM",
    title: "Caché global compartida entre funciones",
    description:
      "`cache` está fuera de `memoizeAsync`, así que TODAS las funciones memoizadas comparten el mismo `Map`. Si otra función usa la clave `7`, recibirá el usuario en lugar de su propio resultado.",
    suggestion: "Crea el `Map` dentro de `memoizeAsync` (`const cache = new Map();` como primera línea) para que cada función tenga su propia caché.",
    lineStart: 20,
    lineEnd: 20,
  },
  {
    kind: "ERROR_HANDLING",
    severity: "MEDIUM",
    title: "Reintenta errores que no se arreglan reintentando",
    description:
      "Cualquier respuesta no exitosa provoca reintentos, incluidos 400, 401 o 404. Un usuario inexistente generará 4 peticiones y unos 3,5 segundos de espera inútiles.",
    suggestion: "Reintenta solo errores de red y códigos 5xx o 429; para los 4xx lanza el error de inmediato (por ejemplo, revisando `response.status >= 500`).",
    lineStart: 6,
    lineEnd: 15,
  },
  {
    kind: "SECURITY",
    severity: "LOW",
    title: "El id se inserta en la URL sin codificar",
    description: "Si `id` viene del usuario, valores como `../admin` o `7?x=1` cambian la ruta o los parámetros de la petición.",
    suggestion: "Codifica el valor: `${encodeURIComponent(id)}`.",
    lineStart: 37,
    lineEnd: 37,
  },
  {
    kind: "BAD_PRACTICE",
    severity: "LOW",
    title: "La caché crece sin límite",
    description: "Las respuestas correctas nunca se eliminan ni expiran: en un proceso de larga duración la memoria crece y los datos pueden quedar desactualizados.",
    suggestion: "Añade un tiempo de expiración o un tamaño máximo (por ejemplo, una caché LRU).",
    lineStart: 31,
    lineEnd: 31,
  },
  {
    kind: "ERROR_HANDLING",
    severity: "LOW",
    title: "fetch sin tiempo límite",
    description: "Si el servidor no responde, `fetch` puede quedarse esperando mucho tiempo y los reintentos nunca llegan.",
    suggestion: "Pasa una señal de cancelación: `fetch(url, { ...options, signal: AbortSignal.timeout(5000) })`.",
    lineStart: 5,
    lineEnd: 5,
  },
];

const DEMO_QUIZ_INPUT: DemoQuestionInput[] = [
  {
    kind: "WHAT_PRINTS",
    prompt: "Con los valores por defecto (`delay = 500`), ¿cuánto espera la función antes del intento con `attempt = 2`, es decir, después de que falle `attempt = 1`?",
    options: ["500 ms", "1000 ms", "2000 ms", "1500 ms"],
    correct: 1,
    explanation: "La espera se calcula con el intento que acaba de fallar: `500 * 2 ** 1 = 1000` ms (línea 14). Antes del siguiente sería 2000 ms.",
    lineStart: 14,
    lineEnd: 15,
    concept: "Backoff exponencial",
  },
  {
    kind: "MULTIPLE_CHOICE",
    prompt: "¿Cuántas peticiones hace como máximo `fetchWithRetry` con `retries = 3`?",
    options: ["3", "4", "5", "Las que hagan falta hasta que funcione"],
    correct: 1,
    explanation: "El bucle va de `attempt = 0` a `attempt <= retries`, es decir 0, 1, 2 y 3: cuatro peticiones (línea 3).",
    lineStart: 3,
    lineEnd: 3,
    concept: "Bucles",
  },
  {
    kind: "TRUE_FALSE",
    prompt: "Si llamas a `getUser(7)` dos veces seguidas, antes de que termine la primera petición, se hacen dos peticiones HTTP.",
    correct: false,
    explanation: "La promesa se guarda en la caché en cuanto se crea (línea 31), así que la segunda llamada recibe la misma promesa pendiente.",
    lineStart: 24,
    lineEnd: 32,
    concept: "Memoización",
  },
  {
    kind: "MULTIPLE_CHOICE",
    prompt: "¿Para qué sirve `cache.delete(key)` dentro del `catch` de la línea 27?",
    options: [
      "Para liberar memoria cuando la petición tiene éxito",
      "Para que un error no quede guardado y la próxima llamada vuelva a intentarlo",
      "Para que JavaScript no muestre el error en consola",
    ],
    correct: 1,
    explanation: "Si no se borrara, la promesa rechazada quedaría en caché y todas las llamadas futuras con esa clave fallarían sin reintentar.",
    lineStart: 27,
    lineEnd: 30,
    concept: "Manejo de errores",
  },
  {
    kind: "WHAT_IF",
    prompt: "¿Qué pasa si eliminas la línea 12 (`throw error;`)?",
    options: [
      "Tras el último intento fallido la función termina devolviendo `undefined` sin avisar del error",
      "La función reintenta para siempre",
      "Se produce un error de sintaxis",
      "No cambia nada",
    ],
    correct: 0,
    explanation: "Sin el `throw`, después del último intento se espera, el bucle termina porque `attempt` supera `retries` y la función acaba sin `return`: devuelve `undefined`.",
    lineStart: 10,
    lineEnd: 13,
    concept: "Manejo de errores",
  },
  {
    kind: "TRUE_FALSE",
    prompt: "Dos funciones distintas creadas con `memoizeAsync` comparten la misma caché.",
    correct: true,
    explanation: "`cache` se declara una sola vez fuera de `memoizeAsync` (línea 20), por eso es compartida: es el primer hallazgo de la auditoría.",
    lineStart: 20,
    lineEnd: 22,
    concept: "Closures",
  },
  {
    kind: "ORDERING",
    prompt: "La primera petición falla y la segunda funciona. Ordena lo que ocurre dentro de `fetchWithRetry`.",
    steps: [
      "Se llama a `fetch` con `attempt = 0`",
      "Se entra al `catch` porque la petición falló",
      "Se calcula una espera de 500 ms",
      "Se espera con `setTimeout`",
      "Se repite `fetch` con `attempt = 1` y se devuelve el JSON",
    ],
    explanation: "Es el recorrido de las líneas 3 a 15 en el primer intento y de la 5 a la 9 en el segundo.",
    lineStart: 3,
    lineEnd: 15,
    concept: "async/await",
  },
];

/** Demo questions WITH their answers: the demo grades in the browser (there is nothing to protect). */
export const DEMO_QUESTIONS = prepareDemoQuestions(DEMO_QUIZ_INPUT);

export const DEMO_DIAGRAMS: DiagramView[] = [
  { kind: "FLOW", ...FLOW_DIAGRAM },
  { kind: "SEQUENCE", ...SEQUENCE_DIAGRAM },
];

export const DEMO_VIEW: AnalysisView = {
  code: DEMO_CODE,
  language: "javascript",
  summary: DEMO_SUMMARY,
  blocks: DEMO_BLOCKS,
  diagrams: DEMO_DIAGRAMS,
  concepts: DEMO_CONCEPTS,
  findings: DEMO_FINDINGS,
  quiz: { id: "demo", questions: DEMO_QUESTIONS.map(toPublicQuestion), attempts: [] },
};
