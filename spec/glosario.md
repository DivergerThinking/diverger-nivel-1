# Glosario

| Término | Definición | Contexto | En el código |
|---|---|---|---|
| Equipo | Portátil, monitor, proyector u otro aparato de la oficina que se presta. Tiene un id y un nombre. | equipos, prestamos | `Equipment` |
| Nombre normalizado | El nombre de un equipo sin espacios al principio ni al final y en minúsculas; dos equipos no pueden tener el mismo. | equipos | `normalizedName` |
| Estado del equipo | `disponible`, `reservado` o `prestado`. | prestamos | `EquipmentStatus` |
| Disponible | Estado de un equipo sin préstamo activo: se puede pedir o prestar. | prestamos | `available` |
| Reservado | Estado de un equipo que un empleado ha pedido y aún no ha recogido. | prestamos | `reserved` |
| Prestado | Estado de un equipo que IT ha entregado o prestado en el mostrador. | prestamos | `lent` |
| Devuelto | Estado, en el historial, de un préstamo cuyo equipo IT ya ha recogido. | prestamos | `returned` |
| Préstamo | Cada vez que un equipo se reserva o se presta a una persona, con su fecha de devolución y su estado (`reservado`, `prestado` o `devuelto`). | prestamos | `Loan` |
| Préstamo activo | El préstamo reservado o prestado de un equipo; como mucho hay uno por equipo. | prestamos | `ActiveLoan` |
| Solicitud | Cuando un empleado pide un equipo disponible con su fecha de devolución; el equipo queda reservado a su nombre. | prestamos | `Request` |
| Entrega | Cuando IT da a quien lo pidió un equipo reservado, que pasa a prestado. | prestamos | `Handover` |
| Préstamo en el mostrador | Cuando IT presta directamente un equipo disponible a una persona, sin solicitud previa. | prestamos | `CounterLoan` |
| Devolución | Cuando IT apunta que un equipo prestado ha vuelto; el equipo vuelve a estar disponible. | prestamos | `Return` |
| Fecha de devolución | Día en que la persona devolverá el equipo, como texto `AAAA-MM-DD`. | prestamos | `dueDate` |
| Hoy | El día actual en Madrid. | prestamos | `todayInMadrid` |
| Préstamo vencido | Equipo prestado cuya fecha de devolución es anterior a hoy. | prestamos | `OverdueLoan` |
| Historial | Los préstamos de un equipo, del más reciente al más antiguo. | prestamos | `LoanHistory` |
| Persona | El correo de quien hace una operación (el del token) o de quien tiene el equipo. | equipos, prestamos | `person` |
| Cuenta de IT | Un correo de la variable de entorno `CORREOS_IT`, sin distinguir mayúsculas. | equipos, prestamos | `ItAccount` |
| Empleado | Cualquier persona con sesión que no tiene una cuenta de IT. | prestamos | `Employee` |
