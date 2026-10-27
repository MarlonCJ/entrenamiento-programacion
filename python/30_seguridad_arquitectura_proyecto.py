r"""
============================================================================
TEMA 30: SEGURIDAD (OWASP), ARQUITECTURA HEXAGONAL Y PROYECTO INTEGRADOR
============================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Seguridad por Diseño y Arquitectura en Capas)
----------------------------------------------------------------------------
¡Felicidades por llegar al tema final de la ruta de ingeniería en Python!
Un desarrollador Senior diseña sistemas donde la seguridad y la arquitectura no
son un parche al final, sino parte de la estructura misma del código:

1) **Criptografía y aleatoriedad segura (`secrets`, `hashlib`, `hmac`)**:
   - **Nunca uses `random` para seguridad**: `random` usa Mersenne Twister, que
     es determinista y predecible. Para tokens de sesión, códigos OTP o llaves
     API usa siempre el módulo `secrets` (`token_urlsafe`, `randbelow`, `choice`).
   - **Almacenamiento de contraseñas**: un hash rápido como `sha256(password)`
     se rompe con fuerza bruta por GPU en segundos. Usa funciones derivadoras de
     clave lentas con *salt* aleatorio único por usuario: `hashlib.scrypt` o
     `hashlib.pbkdf2_hmac` (o `argon2-cffi` en producción).
   - **Ataques de tiempo (*Timing Attacks*)**: el operador `==` entre cadenas o
     bytes se detiene en el primer carácter distinto, filtrando información por
     nanosegundos. Compara siempre firmas HMAC, hashes y tokens con
     `hmac.compare_digest(a, b)` (tiempo constante).
2) **Prevención de Inyecciones (OWASP A03)**:
   - **SQL Injection**: jamás interpoles variables con f-strings o `%` dentro de
     una sentencia SQL. Usa siempre marcadores parametrizados (`?` en `sqlite3`,
     `%s` en `psycopg`) pasando los valores en una tupla separada.
   - **Command Injection**: nunca uses `os.system()` ni `subprocess.run(...,
     shell=True)` con entradas de usuario. Pasa una lista de argumentos
     (`subprocess.run(["git", "status", ruta], shell=False, check=True)`).
   - **Deserialización insegura**: nunca uses `eval()`, `exec()` ni `pickle.loads()`
     sobre datos externos.
3) **Arquitectura Hexagonal (Puertos y Adaptadores)**:
   - **Dominio**: entidades, objetos de valor y excepciones de negocio (0 imports
     de infraestructura).
   - **Aplicación (Casos de Uso)**: orquesta el flujo dependiendo solo de
     *Puertos* (`typing.Protocol`).
   - **Adaptadores (Infraestructura)**: implementaciones reales (SQLite/Postgres,
     HTTP, criptografía, archivos) conectadas en la **Raíz de Composición**.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
----------------------------------------------------------------------------
- Autenticación, generación de tokens de recuperación, verificación de webhooks
  bancarios firmados con `HMAC-SHA256` y bóvedas de credenciales.
- Consultas transaccionales seguras sobre bases de datos relacionales sin riesgo
  de inyección SQL.
- Backends empresariales donde puedes cambiar SQLite en memoria (para pruebas
  instantáneas) por PostgreSQL en producción sin tocar una sola línea del
  dominio ni de los casos de uso.

3. SINTAXIS Y REFERENCIA RÁPIDA
----------------------------------------------------------------------------
import hashlib, hmac, secrets, sqlite3

# 1. Tokens y códigos OTP criptográficamente seguros (módulo secrets)
token_sesion = secrets.token_urlsafe(32)           # 256 bits de entropía en Base64URL
codigo_otp = f"{secrets.randbelow(1_000_000):06d}" # OTP de 6 dígitos ('004821')

# 2. Hashing de contraseña con scrypt + salt aleatorio y compare_digest
def hashear_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    derivado = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=2**14, r=8, p=1, dklen=32)
    return f"{salt.hex()}:{derivado.hex()}"

def verificar_password(password: str, almacenado: str) -> bool:
    salt_hex, _, hash_hex = almacenado.partition(":")
    salt = bytes.fromhex(salt_hex)
    esperado = bytes.fromhex(hash_hex)
    intento = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=2**14, r=8, p=1, dklen=32)
    return hmac.compare_digest(esperado, intento)

# 3. Firma y verificación HMAC-SHA256 para webhooks
def verificar_webhook(cuerpo: bytes, firma_recibida: str, secreto: bytes) -> bool:
    firma_calculada = hmac.new(secreto, cuerpo, hashlib.sha256).hexdigest()
    return hmac.compare_digest(firma_calculada, firma_recibida)

# 4. Consulta SQL parametrizada (inmune a SQL Injection)
con = sqlite3.connect(":memory:")
# CORRECTO: el motor compila el SQL y trata el parámetro estrictamente como dato
con.execute("SELECT id FROM usuarios WHERE email = ?", (email_usuario,))

4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
----------------------------------------------------------------------------
Escenario: Construimos el núcleo de una bóveda financiera con **Arquitectura
Hexagonal**, hashing `scrypt`, comparación en tiempo constante `compare_digest`
y persistencia en **SQLite parametrizado**, demostrando cómo neutraliza un
intento clásico de *SQL Injection* (`' OR '1'='1`).

from dataclasses import dataclass
import hashlib
import hmac
import secrets
import sqlite3
from typing import Protocol

# --- CAPA DE DOMINIO (Objetos de valor y entidades puras) ---
@dataclass(frozen=True, slots=True)
class CuentaUsuario:
    id_usuario: str
    email: str
    password_hash: str
    saldo_centavos: int

# --- PUERTOS (Contratos de los que depende la capa de aplicación) ---
class RepositorioCuentas(Protocol):
    def guardar(self, cuenta: CuentaUsuario) -> None: ...
    def buscar_por_email(self, email: str) -> CuentaUsuario | None: ...

# --- ADAPTADORES DE INFRAESTRUCTURA (SQLite parametrizado + Cripto) ---
class RepositorioCuentasSqlite:
    def __init__(self, conexion: sqlite3.Connection) -> None:
        self._con = conexion
        self._con.execute(
            """
            CREATE TABLE IF NOT EXISTS cuentas (
                id_usuario TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                saldo_centavos INTEGER NOT NULL CHECK (saldo_centavos >= 0)
            )
            """
        )

    def guardar(self, cuenta: CuentaUsuario) -> None:
        with self._con:
            self._con.execute(
                "INSERT INTO cuentas (id_usuario, email, password_hash, saldo_centavos) VALUES (?, ?, ?, ?)",
                (cuenta.id_usuario, cuenta.email, cuenta.password_hash, cuenta.saldo_centavos),
            )

    def buscar_por_email(self, email: str) -> CuentaUsuario | None:
        cursor = self._con.execute(
            "SELECT id_usuario, email, password_hash, saldo_centavos FROM cuentas WHERE email = ?",
            (email,),
        )
        fila = cursor.fetchone()
        return CuentaUsuario(*fila) if fila else None

class GestorCredencialesScrypt:
    def hashear(self, password: str) -> str:
        salt = secrets.token_bytes(16)
        dk = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=2**14, r=8, p=1, dklen=32)
        return f"{salt.hex()}:{dk.hex()}"

    def verificar(self, password: str, hash_guardado: str) -> bool:
        salt_hex, sep, dk_hex = hash_guardado.partition(":")
        if not sep:
            return False
        intento = hashlib.scrypt(
            password.encode("utf-8"), salt=bytes.fromhex(salt_hex), n=2**14, r=8, p=1, dklen=32
        )
        return hmac.compare_digest(bytes.fromhex(dk_hex), intento)

# --- CAPA DE APLICACIÓN (Casos de Uso) ---
class ServicioIdentidad:
    def __init__(self, repo: RepositorioCuentas, cripto: GestorCredencialesScrypt) -> None:
        self._repo = repo
        self._cripto = cripto

    def registrar(self, id_usr: str, email_crudo: str, password: str, saldo_inicial: int) -> CuentaUsuario:
        email = email_crudo.strip().casefold()
        if "@" not in email or len(password) < 8:
            raise ValueError("Credenciales inválidas")
        cuenta = CuentaUsuario(id_usr, email, self._cripto.hashear(password), saldo_inicial)
        self._repo.guardar(cuenta)
        return cuenta

    def autenticar(self, email_crudo: str, password: str) -> bool:
        cuenta = self._repo.buscar_por_email(email_crudo.strip().casefold())
        if cuenta is None:
            return False
        return self._cripto.verificar(password, cuenta.password_hash)

# --- RAÍZ DE COMPOSICIÓN Y PRUEBA DE SEGURIDAD ---
conexion_memoria = sqlite3.connect(":memory:")
repo_sql = RepositorioCuentasSqlite(conexion_memoria)
servicio = ServicioIdentidad(repo_sql, GestorCredencialesScrypt())

servicio.registrar("USR-01", "Ana@Fintech.co", "ClaveSegura#2026", 500_000)
print("Login legítimo:", servicio.autenticar("ana@fintech.co", "ClaveSegura#2026"))
print("Clave errónea:", servicio.autenticar("ana@fintech.co", "otra_clave_123"))
print("Intento SQL Injection:", servicio.autenticar("' OR '1'='1", "cualquiera"))

# Salida esperada:
# Login legítimo: True
# Clave errónea: False
# Intento SQL Injection: False

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
----------------------------------------------------------------------------
- NUNCA USES F-STRINGS EN SQL PARA VALORES: `f"SELECT * FROM t WHERE email = '{x}'"`
  es la vulnerabilidad más explotada de la historia. Usa siempre parámetros `?`.
  Si alguna vez necesitas parametrizar el nombre de una columna de ordenamiento,
  valídalo contra un conjunto cerrado (`if col not in {"fecha", "monto"}: raise ValueError`).
- PROTEGE LOS SECRETOS EN DATACLASSES CON `repr=False`: si tienes un campo
  `token: str` o `password_hash: str` en un `@dataclass`, márcalo como
  `field(repr=False)` para que nunca se filtre accidentalmente en los logs ni en
  los *tracebacks* al imprimir el objeto.
- EVITA EL ATAQUE DE ENUMERACIÓN POR TIEMPO EN EL LOGIN: si cuando el correo no
  existe retornas `False` en 0.01 ms, pero cuando sí existe ejecutas `scrypt` y
  tardas 80 ms, un atacante puede descubrir qué correos están registrados
  midiendo la latencia. Ejecuta un hash simulado (*dummy hash*) cuando el
  usuario no exista.
- DESACTIVA `assert` PARA VALIDACIONES DE SEGURIDAD: ejecutar Python con la
  bandera de optimización `python -O app.py` **elimina todos los `assert` del
  bytecode**. Para comprobar permisos o validar entradas usa `if not cond: raise PermissionError(...)`.
- EL DOMINIO NO DEBE IMPORTAR `sqlite3`, `fastapi` NI `requests`: mantén las
  entidades y reglas de negocio libres de infraestructura para que tu arquitectura
  permanezca limpia y 100 % portable.

6. PROYECTO INTEGRADOR FINAL: 10 RETOS PARA CONSTRUIR UN MOTOR FINTECH SENIOR
============================================================================
En la zona de trabajo al final de este archivo construirás paso a paso una
**Plataforma de Billetera Digital y Pagos Empresariales** en Python 3.12+ usando
únicamente la biblioteca estándar, integrando los 30 temas del curso:

[Fase 1: Dominio Inmutable, Validación y Criptografía]
1. **Objetos de valor blindados (`Email`, `Dinero`, `IdCuenta`)**: diseña
   `@dataclass(frozen=True, slots=True)` que normalicen texto en `NFC`, operen
   en centavos enteros o `Decimal`, oculten datos sensibles con `repr=False` y
   lancen excepciones de dominio (`ErrorValidacionDominio`) ante estados inválidos.
2. **Módulo de seguridad (`ServicioCripto`)**: implementa generación de tokens y
   claves de idempotencia con `secrets`, hashing de contraseñas con
   `hashlib.scrypt` + *salt*, comparación constante `hmac.compare_digest` y
   firma/verificación `HMAC-SHA256` de webhooks entrantes.
3. **Entidad `Transaccion` y máquina de estados con `StrEnum` y `match/case`**:
   modela los estados `PENDIENTE`, `LIQUIDADA`, `RECHAZADA` y `REVERSADA`
   validando las transiciones permitidas mediante *pattern matching* estructural.

[Fase 2: Puertos, Adaptadores SQLite Transaccionales y Caché]
4. **Puertos con `typing.Protocol`**: define `RepositorioCuentas`,
   `RepositorioTransacciones`, `PublicadorEventos` y `Reloj` sin acoplarlos a
   ninguna base de datos concreta.
5. **Adaptador `sqlite3` ACID con consultas parametrizadas**: implementa las
   tablas `cuentas` y `transacciones` (con `FOREIGN KEY`, `CHECK (saldo >= 0)` y
   `UNIQUE (clave_idempotencia)`), ejecutando el débito, el crédito y el
   registro del movimiento dentro de una transacción atómica (`with conexion:`).
6. **Decorador de infraestructura (Rate Limiter + Circuit Breaker)**: protege el
   servicio de autenticación contra ataques de fuerza bruta por cuenta/IP usando
   `collections.deque` y un reloj inyectable.

[Fase 3: Casos de Uso, Patrones de Diseño y Concurrencia]
7. **Estrategias de comisión (Strategy + Factory)**: configura políticas puras
   por tipo de cuenta (`PERSONAL`, `PYME`, `CORPORATIVA`) con `functools.partial`
   y un registro de estrategias extensible sin modificar el caso de uso.
8. **Caso de uso `TransferirFondos` con Idempotencia y Observer**: verifica
   fondos, evita cobros duplicados si se reenvía la misma `clave_idempotencia`,
   persiste atómicamente y emite eventos `TransaccionLiquidada` a un bus de
   suscriptores desacoplados.

[Fase 4: Auditoría en Streaming, Analítica Funcional y Suite de Pruebas]
9. **Exportador e verificador de auditoría `.jsonl` con escritura atómica**:
   exporta el libro mayor en streaming a un archivo `.jsonl` (mediante archivo
   temporal + `os.replace`) donde cada línea incluya un hash encadenado SHA-256,
   y agrega un lector generador que verifique que ningún registro fue alterado.
10. **Suite de pruebas automatizadas (`unittest`)**: escribe pruebas siguiendo
    el patrón AAA que verifiquen: transferencia exitosa, rollback ante saldo
    insuficiente, idempotencia ante peticiones repetidas, neutralización de
    *SQL Injection*, rechazo de firma HMAC adulterada e integridad del archivo
    de auditoría.
"""

# Zona de trabajo: escribe aquí tus soluciones para los 10 retos del Proyecto Integrador.
