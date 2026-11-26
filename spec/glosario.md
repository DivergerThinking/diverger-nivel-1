# Glosario

| Término | Definición | Contexto | En el código |
|---|---|---|---|
| Equipo | Portátil, monitor, proyector u otro aparato de la oficina que se presta, con un nombre único. | equipos, prestamos | `Equipment` |
| Nombre del equipo | Nombre con el que IT da de alta un equipo; dos nombres son el mismo si solo cambian mayúsculas o espacios en los extremos. | equipos | `equipmentName` |
| Estado del equipo | `disponible`, `reservado` o `prestado`. | prestamos | `EquipmentStatus` |
| Solicitud | Petición de un empleado para un equipo disponible, con su fecha de devolución; deja el equipo reservado. | prestamos | `Request` |
| Reserva | Estado de un equipo pedido por un empleado que IT aún no ha entregado. | prestamos | `Reservation` |
| Entrega | Paso en que IT da al empleado el equipo reservado, que pasa a prestado. | prestamos | `Handover` |
| Préstamo | Equipo en manos de una persona hasta su fecha de devolución. | prestamos | `Loan` |
| Préstamo en el mostrador | Préstamo que IT hace directamente, sin solicitud previa. | prestamos | `CounterLoan` |
| Devolución | Registro de que un equipo prestado ha vuelto; queda disponible. | prestamos | `Return` |
| Fecha de devolución | Día `AAAA-MM-DD` en que la persona devolverá el equipo. | prestamos | `returnDate` |
| Préstamo vencido | Préstamo cuya fecha de devolución es anterior a hoy en Madrid. | prestamos | `OverdueLoan` |
| Historial | Lista de los préstamos de un equipo, con estado `reservado`, `prestado` o `devuelto`. | prestamos | `LoanHistory` |
| Persona | Correo de quien tiene el equipo reservado o prestado. | prestamos | `person` |
| Cuenta de IT | Cuenta cuyo correo está en la variable de entorno `CORREOS_IT`. | equipos, prestamos | `isItAccount` |
