# Glosario

| Término | Definición | Contexto | En el código |
|---|---|---|---|
| Persona | Quien hace la petición, identificada por el correo verificado de su token de Google. | cuentas | `Person` |
| Cuenta de IT | Persona cuyo correo está en la lista `CORREOS_IT`, sin distinguir mayúsculas. | cuentas | `ItAccount` |
| Equipo | Portátil, monitor, proyector u otro aparato del inventario, con id y nombre. | equipos | `Device` |
| Nombre normalizado | Nombre del equipo sin espacios en los extremos y en minúsculas; dos equipos no pueden compartirlo. | equipos | `normalizedName` |
| Estado | Situación de un equipo: `disponible`, `reservado` o `prestado`. | prestamos | `DeviceStatus` |
| Solicitud | Petición de un equipo disponible por una persona, con su fecha de devolución; deja el equipo reservado. | prestamos | `Request` |
| Reserva | Préstamo en estado `reservado`: pedido y aún no entregado. | prestamos | `Reservation` |
| Entrega | Paso de una reserva a prestado, con la misma persona y fecha de devolución. | prestamos | `Handover` |
| Préstamo | Registro de quién tiene un equipo y hasta cuándo, desde la reserva o el mostrador hasta la devolución. | prestamos | `Loan` |
| Préstamo activo | El préstamo reservado o prestado de un equipo; como mucho uno por equipo. | prestamos | `ActiveLoan` |
| Préstamo en el mostrador | Préstamo que IT hace directamente a una persona, sin reserva previa. | prestamos | `CounterLoan` |
| Devolución | Cierre de un préstamo: el equipo vuelve a disponible y el préstamo queda `devuelto`. | prestamos | `Return` |
| Fecha de devolución | Fecha `AAAA-MM-DD` en la que el equipo debe volver. | prestamos | `returnDate` |
| Hoy | El día actual en Madrid (zona Europe/Madrid). | prestamos | `today` |
| Préstamo vencido | Equipo prestado cuya fecha de devolución es anterior a hoy. | prestamos | `OverdueLoan` |
| Historial | Lista de los préstamos de un equipo, del más reciente al más antiguo. | prestamos | `LoanHistory` |
