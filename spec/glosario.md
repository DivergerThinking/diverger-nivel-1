# Glosario

| Término | Definición | Contexto | En el código |
|---|---|---|---|
| Cuenta de IT | Cuenta cuyo correo está en la variable de entorno `CORREOS_IT`, comparado sin distinguir mayúsculas. Puede hacer las operaciones «Solo IT» y también lo de un empleado. | cuentas | `ItAccount` |
| Empleado | Persona que ha iniciado sesión con su cuenta de Google de la empresa y no es cuenta de IT. | cuentas | `Employee` |
| Persona | Correo del token de identidad de la petición: quien hace cada operación, o a quien se presta un equipo. | cuentas, prestamos | `person` |
| Equipo | Portátil, monitor o proyector que IT presta, identificado por su id y su nombre. | equipos, prestamos | `Equipment` |
| Nombre del equipo | Nombre único del equipo; dos nombres son el mismo si solo cambian las mayúsculas o los espacios del principio y del final. | equipos | `name` |
| Nombre normalizado | El nombre del equipo sin espacios al principio ni al final y en minúsculas; la clave que garantiza que es único. | equipos | `normalizedName` |
| Estado del equipo | `disponible`, `reservado` o `prestado`; se deduce del préstamo activo del equipo. | prestamos | `EquipmentStatus` |
| Préstamo | Registro de que un equipo se reserva o se presta a una persona hasta una fecha de devolución. Su estado es `reservado`, `prestado` o `devuelto`. | prestamos | `Loan` |
| Estado del préstamo | `reservado`, `prestado` o `devuelto`. | prestamos | `LoanStatus` |
| Préstamo activo | El préstamo de un equipo que está reservado o prestado; un equipo tiene como mucho uno. | prestamos | `ActiveLoan` |
| Solicitud | Petición de un empleado que reserva un equipo disponible a su nombre. | prestamos | `requestEquipment` |
| Reserva | Préstamo en estado `reservado`: pedido y aún no entregado. | prestamos | `Reservation` |
| Entrega | Paso de una reserva a préstamo `prestado`, con la misma persona y fecha de devolución. | prestamos | `handOver` |
| Préstamo en el mostrador | Préstamo que IT hace directamente a una persona, sin solicitud previa. | prestamos | `lendAtCounter` |
| Devolución | Paso de un préstamo `prestado` a `devuelto`; el equipo vuelve a estar disponible. | prestamos | `registerReturn` |
| Fecha de devolución | Fecha `AAAA-MM-DD` en que el equipo debe volver; campo `devolucion` de la API. | prestamos | `devolucion` |
| Hoy | El día actual en la zona horaria de Madrid (Europe/Madrid). | prestamos | `todayInMadrid` |
| Préstamo vencido | Préstamo `prestado` cuya fecha de devolución es anterior a hoy. | prestamos | `OverdueLoan` |
| Historial | Lista de los préstamos de un equipo, del más reciente al más antiguo. | prestamos | `LoanHistory` |
