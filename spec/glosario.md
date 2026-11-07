# Glosario

| Término | Definición | Contexto | En el código |
|---|---|---|---|
| Equipo | Portátil, monitor, proyector u otro aparato de IT que se presta, identificado por un id y un nombre único. | equipos | `Equipment` |
| Nombre del equipo | Texto con el que IT da de alta un equipo; dos nombres son el mismo si solo cambian mayúsculas o espacios en los extremos. | equipos | `EquipmentName` |
| Nombre normalizado | El nombre sin espacios en los extremos y en minúsculas, con el que se comparan los nombres. | equipos | `normalizedName` |
| Cuenta de IT | Correo de la lista `CORREOS_IT`, comparado sin distinguir mayúsculas; puede hacer las operaciones «Solo IT». | equipos | `isItAccount` |
| Persona | Correo de quien tiene un equipo reservado o prestado; en la solicitud es el correo del token. | prestamos | `person` |
| Estado del equipo | `disponible`, `reservado` o `prestado`. | prestamos | `EquipmentStatus` |
| Solicitud | Petición de un empleado de un equipo disponible, con fecha de devolución; deja el equipo reservado a su nombre. | prestamos | `Request` |
| Reserva | Situación de un equipo pedido por un empleado que IT aún no le ha entregado. | prestamos | `Reservation` |
| Entrega | Paso de un equipo reservado a prestado, con la misma persona y fecha de devolución. | prestamos | `Handover` |
| Préstamo en el mostrador | Préstamo directo de IT a una persona, sin solicitud previa; admite fechas pasadas. | prestamos | `DeskLoan` |
| Préstamo | Registro de una reserva o un préstamo de un equipo a una persona, con su fecha de devolución y su estado (`reservado`, `prestado` o `devuelto`). | prestamos | `Loan` |
| Préstamo activo | El préstamo de un equipo que está reservado o prestado; un equipo tiene como mucho uno. | prestamos | `ActiveLoan` |
| Devolución | Fin de un préstamo: el equipo vuelve a estar disponible y el préstamo queda devuelto. | prestamos | `Return` |
| Fecha de devolución | Fecha `AAAA-MM-DD` que existe, en la que la persona debe devolver el equipo. | prestamos | `returnDate` |
| Hoy | El día en curso en Madrid (Europe/Madrid). | prestamos | `today` |
| Préstamo vencido | Equipo prestado cuya fecha de devolución es anterior a hoy. | prestamos | `OverdueLoan` |
| Historial | Lista de los préstamos de un equipo, del más reciente al más antiguo. | prestamos | `LoanHistory` |
