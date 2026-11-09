# Glosario

| Término | Definición | Contexto | En el código |
|---|---|---|---|
| Cuenta | La persona o la cuenta de servicio que hace una petición, identificada por el correo verificado de su token de identidad de Google. | cuentas | `Account` |
| Correo | Dirección de correo de una cuenta; dos correos son el mismo aunque cambien las mayúsculas. | cuentas | `email` |
| Cuenta de IT | Cuenta cuyo correo está en la variable de entorno `CORREOS_IT`. Puede hacer las operaciones «Solo IT» y también las de un empleado. | cuentas | `isIt` |
| Empleado | Cuenta que no es de IT: ve los equipos y pide uno libre. | cuentas | `Employee` |
| Inventario de IT | Sistema de IT que se conecta a la API con una cuenta de servicio incluida en `CORREOS_IT`. | cuentas | `Inventory` |
| Equipo | Portátil, monitor, proyector u otro aparato de la oficina que se presta. | equipos | `Device` |
| Nombre del equipo | Nombre con el que se da de alta un equipo; obligatorio y único. | equipos | `name` |
| Nombre normalizado | El nombre sin espacios al principio y al final y en minúsculas; dos equipos no comparten nombre normalizado. | equipos | `normalizedName` |
| Estado del equipo | `disponible`, `reservado` o `prestado`. | prestamos | `DeviceStatus` |
| Persona | Correo de quien tiene un equipo reservado o prestado. | prestamos | `person` |
| Fecha de devolución | Día en que se devolverá el equipo, como texto `AAAA-MM-DD`. | prestamos | `returnDate` |
| Hoy | El día actual en Madrid (zona horaria Europe/Madrid). | prestamos | `today` |
| Solicitud | Petición de un empleado para un equipo disponible; lo deja reservado a su nombre. | prestamos | `Request` |
| Reserva | Estado de un equipo pedido que IT aún no ha entregado. | prestamos | `Reservation` |
| Entrega | Paso de una reserva a préstamo cuando IT da el equipo. | prestamos | `Handover` |
| Préstamo | Registro de quién tiene o tuvo un equipo y hasta cuándo, con estado `reservado`, `prestado` o `devuelto`. | prestamos | `Loan` |
| Préstamo en el mostrador | Préstamo que IT hace directamente a una persona, sin solicitud previa; admite fechas pasadas. | prestamos | `DeskLoan` |
| Préstamo activo | La reserva o el préstamo en curso de un equipo; como mucho uno por equipo. | prestamos | `ActiveLoan` |
| Devolución | Paso de un préstamo a devuelto, que deja el equipo disponible. | prestamos | `Return` |
| Préstamo vencido | Préstamo de un equipo prestado cuya fecha de devolución es anterior a hoy. | prestamos | `OverdueLoan` |
| Historial | Lista de los préstamos de un equipo, del más reciente al más antiguo. | prestamos | `LoanHistory` |
