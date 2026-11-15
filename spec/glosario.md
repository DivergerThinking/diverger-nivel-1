# Glosario

| Término | Definición | Contexto | En el código |
|---|---|---|---|
| Equipo | Un portátil, monitor, proyector u otro aparato de la oficina que se presta. Tiene un id y un nombre. | equipos, prestamos | `Equipment` |
| Nombre del equipo | El nombre con el que IT da de alta un equipo. Dos nombres son el mismo si solo se diferencian en mayúsculas o en espacios al principio o al final. | equipos | `equipmentName` |
| Nombre normalizado | El nombre del equipo sin espacios al principio y al final y en minúsculas; sirve para detectar nombres repetidos. | equipos | `normalizedName` |
| Cuenta de IT | Una cuenta cuyo correo está en la variable de entorno `CORREOS_IT`, sin distinguir mayúsculas. Solo ella hace las operaciones «Solo IT». | equipos, prestamos | `ItAccount` |
| Empleado | Cualquier persona que entra con su cuenta de Google y no es necesariamente de IT. | prestamos | `Employee` |
| Persona | El correo de quien tiene el equipo reservado o prestado; en cada operación, el correo del token. | prestamos | `person` |
| Estado del equipo | `disponible`, `reservado` o `prestado`. | prestamos | `EquipmentStatus` |
| Solicitud | La petición de un empleado sobre un equipo disponible, con su fecha de devolución, que deja el equipo reservado a su nombre. | prestamos | `Request` |
| Entrega | El paso en que IT entrega un equipo reservado y este pasa a prestado con la misma persona y fecha. | prestamos | `Handover` |
| Préstamo en el mostrador | El préstamo que IT hace directamente a una persona sobre un equipo disponible, sin solicitud previa. | prestamos | `CounterLoan` |
| Devolución | El paso en que IT apunta que un equipo prestado ha vuelto; el equipo queda disponible. | prestamos | `Return` |
| Fecha de devolución | La fecha `AAAA-MM-DD` en que se devolverá el equipo; en la API, el campo `devolucion`. | prestamos | `dueDate` |
| Hoy | El día actual en Madrid. | prestamos | `todayInMadrid` |
| Préstamo | Cada vez que un equipo se reserva o se presta, desde la solicitud o el préstamo en el mostrador hasta la devolución. | prestamos | `Loan` |
| Préstamo vencido | Un equipo prestado cuya fecha de devolución es anterior a hoy. | prestamos | `OverdueLoan` |
| Historial | La lista de préstamos de un equipo, cada uno con persona, fecha de devolución y estado (`reservado`, `prestado` o `devuelto`). | prestamos | `LoanHistory` |
