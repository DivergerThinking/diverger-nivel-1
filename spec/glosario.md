# Glosario

| Término | Definición | Contexto | En el código |
|---|---|---|---|
| Equipo | Portátil, monitor, proyector u otro aparato de la oficina que se presta. Tiene un id y un nombre único. | equipos | `Equipment` |
| Nombre normalizado | El nombre del equipo sin espacios al principio ni al final y en minúsculas; dos equipos no pueden compartirlo. | equipos | `normalizedName` |
| Estado del equipo | `disponible`, `reservado` o `prestado`. | prestamos | `EquipmentStatus` |
| Persona | El correo de quien tiene el equipo reservado o prestado. | prestamos | `person` |
| Fecha de devolución | Día en que se devolverá el equipo, en formato `AAAA-MM-DD`. | prestamos | `returnDate` |
| Hoy | El día actual en Madrid (zona `Europe/Madrid`). | prestamos | `today` |
| Solicitud | Petición de un empleado de un equipo disponible; lo deja reservado. | prestamos | `Request` |
| Entrega | IT entrega un equipo reservado; pasa a prestado. | prestamos | `Handover` |
| Préstamo en el mostrador | IT presta directamente un equipo disponible a una persona. | prestamos | `CounterLoan` |
| Devolución | IT apunta que se ha devuelto un equipo prestado; vuelve a disponible. | prestamos | `Return` |
| Préstamo | Cada reserva o préstamo de un equipo, con su persona, su fecha de devolución y su estado en el historial: `reservado`, `prestado` o `devuelto`. | prestamos | `Loan` |
| Préstamo vencido | Equipo prestado cuya fecha de devolución es anterior a hoy. | prestamos | `OverdueLoan` |
| Historial | Los préstamos de un equipo, del más reciente al más antiguo. | prestamos | `LoanHistory` |
| Cuenta de IT | Correo incluido en la variable de entorno `CORREOS_IT`; se compara sin distinguir mayúsculas. | equipos, prestamos | `isItAccount` |
