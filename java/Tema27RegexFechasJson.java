import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.Period;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/*
 * ============================================================================
 * TEMA 27: EXPRESIONES REGULARES, FECHAS ISO-8601/UTC (JAVA.TIME) Y JSON SEGURO
 * ============================================================================
 *
 * 1. ¿QUE ES Y POR QUE IMPORTA? (Modelo Mental en Sistemas Distribuidos)
 * ----------------------------------------------------------------------------
 * En aplicaciones empresariales, el 80% de los bugs sutiles en integraciones
 * provienen de tres fuentes: validacion/extraccion de texto mal hecha (o
 * vulnerable a ReDoS), manejo incorrecto de zonas horarias, y serializacion JSON
 * insegura.
 *
 * Modelo Mental en la JVM:
 * 1) **Expresiones Regulares (`java.util.regex.Pattern` y `Matcher`)**:
 *    Compilar una expresion regular (`Pattern.compile(...)`) construye un
 *    automata finito en memoria y es una operacion COSTOSA. En produccion, SIEMPRE
 *    precompila el `Pattern` en una constante `private static final Pattern` y
 *    reutilizalo; `Pattern` es inmutable y *thread-safe*, mientras que `Matcher`
 *    se crea por cada llamada (`PATRON.matcher(texto)`).
 * 2) **API Moderna de Fechas y Tiempo (`java.time` - JSR-310)**:
 *    Todas las clases de `java.time` son **INMUTABLES y Thread-Safe** (a
 *    diferencia de las obsoletas y rotas `java.util.Date`, `Calendar` y
 *    `SimpleDateFormat`, que jamas debes usar en codigo nuevo):
 *    - `Instant`: Un punto exacto en la linea de tiempo universal (UTC / Epoch).
 *      Ideal para timestamps de auditoria y eventos de servidor (`2026-10-25T21:00:00Z`).
 *    - `LocalDate` / `LocalDateTime`: Fecha/hora civil SIN zona horaria (ej. fecha
 *      de nacimiento o feriado local).
 *    - `ZonedDateTime`: Fecha y hora con reglas completas de zona horaria e
 *      horario de verano (`ZoneId.of("America/Bogota")`).
 *    - `Duration` (tiempo en segundos/nanosegundos) vs `Period` (anos, meses, dias).
 * 3) **Serializacion y Escapado JSON Seguro**:
 *    Entender como construir y validar cargas JSON escapando comillas y caracteres
 *    de control sin permitir inyeccion de estructura JSON.
 *
 * 2. ¿CUANDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Validacion y Enmascaramiento de Datos Sensibles (PII Masking con Regex):
 *   Ocultar digitos de tarjetas de credito o correos en los logs de aplicacion.
 * - Facturacion, Suscripciones y SLAs Internacionales (`java.time`): Guardar
 *   todo evento en UTC (`Instant`) y convertir a la zona horaria del usuario
 *   (`ZonedDateTime`) solo al mostrar en pantalla o generar un PDF.
 * - Comunicacion entre Microservicios (Payloads JSON + ISO-8601): Intercambiar
 *   fechas en formato estandar `2026-10-25T15:30:00Z` y montos exactos.
 *
 * 3. SINTAXIS Y REFERENCIA RAPIDA
 * ----------------------------------------------------------------------------
 * // 1. Regex precompilada con grupos con nombre (Named Capturing Groups):
 * private static final Pattern PATRON_CODIGO =
 *     Pattern.compile("^(?<prefijo>[A-Z]{3})-(?<numero>\\d{4})$");
 *
 * // Matcher m = PATRON_CODIGO.matcher("FAC-2026");
 * // if (m.matches()) {
 * //     String prefijo = m.group("prefijo"); // "FAC"
 * //     int num = Integer.parseInt(m.group("numero")); // 2026
 * // }
 *
 * // 2. Fechas inmutables en java.time:
 * Instant ahoraUtc = Instant.now();
 * LocalDate vencimiento = LocalDate.of(2026, 10, 25).plusDays(30);
 * long diasRestantes = Period.between(LocalDate.of(2026, 10, 25), vencimiento).getDays();
 *
 * 4. EJEMPLO PRACTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un higienizador de logs de auditoria enmascara correos electronicos
 * para cumplir normativas de privacidad y formatea la marca de tiempo UTC a la
 * zona horaria de Bogota/Lima.
 *
 * private static final Pattern EMAIL_REGEX =
 *     Pattern.compile("([a-zA-Z0-9._%+-])[a-zA-Z0-9._%+-]*(@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})");
 *
 * static String sanitizarLog(String mensaje, Instant instanteUtc) {
 *     String limpio = EMAIL_REGEX.matcher(mensaje).replaceAll("$1***$2");
 *     ZonedDateTime horaLocal = instanteUtc.atZone(ZoneId.of("America/Bogota"));
 *     return "[" + DateTimeFormatter.ISO_OFFSET_DATE_TIME.format(horaLocal) + "] " + limpio;
 * }
 * // Ejecucion en main:
 * // Instant t = Instant.parse("2026-10-25T20:00:00Z");
 * // System.out.println(sanitizarLog("Pago de ana.perez@empresa.com aprobado", t));
 * // Salida esperada:
 * // [2026-10-25T15:00:00-05:00] Pago de a***@empresa.com aprobado
 *
 * 5. BUENAS PRACTICAS Y ERRORES COMUNES (Clean Code, Effective Java & Gotchas)
 * ----------------------------------------------------------------------------
 * - NUNCA EJECUTES `String.matches(regex)` DENTRO DE UN BUCLE: `str.matches(r)`
 *   compila el `Pattern` desde cero en cada iteracion! Declara siempre un
 *   `private static final Pattern` y usa `PATRON.matcher(str).matches()`.
 * - CUIDADO CON EL BACKTRACKING CATASTROFICO (ReDoS - Regular Expression Denial of Service):
 *   Expresiones con cuantificadores anidados ambiguos como `(a+)+$` pueden colgar
 *   la CPU al 100% con una cadena de solo 30 caracteres.
 * - RECUERDA QUE `java.time` ES INMUTABLE: Llamar a `fecha.plusDays(5)` NO
 *   modifica `fecha`; devuelve una NUEVA instancia. Debes reasignarla:
 *   `fecha = fecha.plusDays(5);`.
 * - NUNCA USES `YYYY` (Week-based year) EN `DateTimeFormatter`: Usa siempre
 *   `yyyy` (en minuscula). `YYYY` cambia al ano siguiente en los ultimos dias
 *   de diciembre si pertenecen a la semana 1 del nuevo ano!
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Basico]
 * 1. Validador precompilado de SKU e identificadores: Crea un `Pattern` constante
 *    que valide codigos con formato `"PROD-1234-XY"` (4 letras, 4 digitos, 2 letras)
 *    y pruebalo con casos validos e invalidos.
 * 2. Calculo de edades y vencimientos con `LocalDate`: Dada una fecha de emision
 *    de factura, calcula su fecha de vencimiento a 30 dias, si ya esta vencida
 *    respecto a una fecha de corte y cuantos dias de mora tiene (`ChronoUnit.DAYS.between`).
 * 3. Formateo y parseo seguro con `DateTimeFormatter`: Parsea una fecha en formato
 *    `"25/10/2026"` a `LocalDate` y conviertela al formato estandar ISO `"2026-10-25"`.
 *
 * [Intermedio]
 * 4. Extraccion estructurada de Logs con *Named Groups*: Dada una linea de log
 *    `"2026-10-25T14:20:00Z [ERROR] (ServicioPagos) Fallo en orden #9845 por $125.50"`,
 *    extrae con grupos con nombre el timestamp, el nivel, el servicio, el ID de
 *    orden y el monto a un `record EventoLog`.
 * 5. Enmascarador de Datos Sensibles (PII Masking): Crea un metodo que oculte
 *    numeros de tarjeta en un texto dejando visibles solo los ultimos 4 digitos
 *    (`"4111-2222-3333-4444"` -> `"****-****-****-4444"`).
 * 6. Conversion entre Zonas Horarias (`Instant` y `ZonedDateTime`): Programa una
 *    reunion en `"America/Bogota"` y muestra a que hora exacta ocurrira en
 *    `"Europe/Madrid"`, `"Asia/Tokyo"` y en `"UTC"`.
 * 7. Medicion de latencia con `Instant` / `Duration`: Mide el tiempo transcurrido
 *    entre dos instantes y formatealo en milisegundos y segundos.
 *
 * [Senior / Produccion]
 * 8. Calculador de Dias Habiles Empresariales (SLA Calculator): Implementa
 *    `sumarDiasHabiles(LocalDate inicio, int diasHabiles, Set<LocalDate> festivos)`
 *    que sume dias saltando sabados (`DayOfWeek.SATURDAY`), domingos y cualquier
 *    fecha presente en el conjunto de dias festivos.
 * 9. Serializador JSON Seguro sin dependencias externas: Implementa un metodo
 *    que convierta un objeto `PedidoResumen` (con textos que pueden contener
 *    comillas `"`, barras `\` y saltos de linea `\n`, fecha `Instant` y lista de
 *    items) a un JSON 100% valido y escapado contra inyeccion.
 * 10. Extractor y Validador de Payloads JSON Ligero: Usando expresiones regulares
 *     seguras y parseo defensivo, extrae los campos de un mensaje JSON plano
 *     (`{"evento":"PAGO","monto":150.25,"timestamp":"2026-10-25T10:00:00Z"}`),
 *     validando tipos y convirtiendolo en un `record` de dominio.
 */
public class Tema27RegexFechasJson {
    public static void main(String[] args) {
        // Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
    }
}
