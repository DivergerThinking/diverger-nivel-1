# Glosario

| Término | Definición | Contexto | En el código |
|---|---|---|---|
| Equipo | Portátil, monitor, proyector u otro aparato de la oficina que se presta. Tiene un id y un nombre. | equipos, prestamos | `Equipment` |
| Nombre del equipo | Nombre con el que IT da de alta un equipo. Es único: dos nombres son el mismo si solo se diferencian en mayúsculas o en espacios al principio o al final. | equipos | `name` |
| Clave del nombre | El nombre sin espacios al principio ni al final y en minúsculas; sirve para comprobar que es único. | equipos | `nameKey` |
| Cuenta de IT | Correo incluido en la variable de entorno `CORREOS_IT`, sin distinguir mayúsculas. Solo una cuenta de IT puede hacer las operaciones «Solo IT». | equipos, prestamos | `ItAccount` |
| Persona | El correo de quien tiene un equipo reservado o prestado. En cada operación, la persona que la hace es el correo del token. | prestamos | `person` |
| Estado del equipo | `disponible`, `reservado` o `prestado`. | prestamos | `EquipmentStatus` |
| Solicitud | Petición de un empleado para llevarse un equipo disponible, con su fecha de devolución. Deja el equipo reservado a su nombre. | prestamos | `Request` |
| Reserva | Situación de un equipo pedido por un empleado y aún no entregado. | prestamos | `Reservation` |
| Entrega | Acto en que IT da a quien lo pidió un equipo reservado, que pasa a prestado. | prestamos | `Handover` |
| Préstamo | Registro de que una persona tiene o tuvo un equipo, con su fecha de devolución y su estado (`reservado`, `prestado` o `devuelto`). | prestamos | `Loan` |
| Préstamo activo | El préstamo reservado o prestado de un equipo; como mucho hay uno por equipo. | prestamos | `ActiveLoan` |
| Préstamo en el mostrador | Préstamo que IT hace directamente a una persona, sin solicitud previa. | prestamos | `CounterLoan` |
| Devolución | Acto en que IT apunta que un equipo prestado ha vuelto; el equipo queda disponible. | prestamos | `Return` |
| Fecha de devolución | Día en que la persona devolverá el equipo, como texto `AAAA-MM-DD`. | prestamos | `returnDate` |
| Hoy | El día actual en Madrid (zona horaria `Europe/Madrid`). | prestamos | `todayInMadrid` |
| Préstamo vencido | Equipo prestado cuya fecha de devolución es anterior a hoy. | prestamos | `OverdueLoan` |
| Historial | Lista de los préstamos de un equipo, del más reciente al más antiguo. | prestamos | `LoanHistory` |
