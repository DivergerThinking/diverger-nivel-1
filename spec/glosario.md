# Glosario

| Término | Definición | Contexto | En el código |
|---|---|---|---|
| Equipo | Aparato de la oficina que se presta (portátil, monitor, proyector), identificado por un id y un nombre. | equipos | `Equipment` |
| Nombre del equipo | Texto con el que IT da de alta un equipo; dos nombres son el mismo si solo cambian mayúsculas o espacios en los extremos. | equipos | `name` |
| Nombre normalizado | El nombre sin espacios en los extremos y en minúsculas, usado solo para comprobar que no se repite. | equipos | `normalizedName` |
| Estado del equipo | `disponible`, `reservado` o `prestado`. | prestamos | `EquipmentStatus` |
| Préstamo | Registro de que una persona tiene o tuvo un equipo, con su fecha de devolución y su estado: `reservado`, `prestado` o `devuelto`. | prestamos | `Loan` |
| Préstamo activo | El préstamo de un equipo en estado reservado o prestado; como mucho uno por equipo. | prestamos | `ActiveLoan` |
| Solicitud | Petición de un empleado de un equipo disponible, que lo deja reservado a su nombre. | prestamos | `request` |
| Reserva | Estado de un préstamo pedido por un empleado y aún no entregado. | prestamos | `reserved` |
| Entrega | Paso de una reserva a préstamo cuando IT da el equipo. | prestamos | `handOver` |
| Préstamo en el mostrador | Préstamo que IT hace directamente a una persona, sin reserva previa. | prestamos | `lendAtDesk` |
| Devolución | Momento en que IT apunta que el equipo ha vuelto; el equipo queda disponible. | prestamos | `return` |
| Fecha de devolución | Día, en formato `AAAA-MM-DD`, en que la persona devolverá el equipo. | prestamos | `returnDate` |
| Préstamo vencido | Préstamo en estado prestado cuya fecha de devolución es anterior a hoy en Madrid. | prestamos | `OverdueLoan` |
| Historial | Lista de los préstamos de un equipo, del más reciente al más antiguo. | prestamos | `history` |
| Persona | Correo de quien tiene el equipo o de quien hace la operación (el correo del token). | prestamos | `person` |
| Cuenta de IT | Cuenta cuyo correo está en la variable de entorno `CORREOS_IT`, comparada sin distinguir mayúsculas. | equipos, prestamos | `isItAccount` |
