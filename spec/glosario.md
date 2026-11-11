# Glosario

| Término | Definición | Contexto | En el código |
|---|---|---|---|
| Equipo | Aparato de la oficina que se presta (portátil, monitor, proyector), identificado por su id y su nombre. | equipos | `Equipment` |
| Nombre del equipo | Nombre que IT da al equipo; dos nombres son el mismo si solo se diferencian en mayúsculas o en espacios al principio o al final. | equipos | `name` |
| Nombre normalizado | El nombre sin espacios en los extremos y en minúsculas; sirve para comprobar que no se repite. | equipos | `normalizedName` |
| Estado del equipo | Situación del equipo: `disponible`, `reservado` o `prestado`. | prestamos | `EquipmentStatus` |
| Disponible | Estado del equipo que nadie tiene ni ha pedido. | prestamos | `available` |
| Reservado | Estado del equipo que un empleado ha pedido y aún no ha recogido. | prestamos | `reserved` |
| Prestado | Estado del equipo que tiene una persona. | prestamos | `lent` |
| Solicitud | Petición de un empleado de un equipo disponible, con su fecha de devolución; deja el equipo reservado. | prestamos | `Request` |
| Entrega | Paso de un equipo reservado a prestado, hecho por IT, con la misma persona y fecha de devolución. | prestamos | `Handover` |
| Préstamo en el mostrador | Préstamo directo de un equipo disponible que hace IT a una persona, con su fecha de devolución. | prestamos | `CounterLoan` |
| Devolución | Paso de un equipo prestado a disponible, apuntado por IT. | prestamos | `Return` |
| Préstamo | Registro de una reserva o un préstamo de un equipo, con su persona, su fecha de devolución y su estado (`reservado`, `prestado` o `devuelto`). | prestamos | `Loan` |
| Devuelto | Estado de un préstamo cuyo equipo ya se ha devuelto. | prestamos | `returned` |
| Persona | Correo de quien tiene o ha pedido el equipo. | prestamos | `person` |
| Fecha de devolución | Día en que el equipo tiene que volver, como texto `AAAA-MM-DD`. | prestamos | `returnDate` |
| Hoy | El día actual en Madrid. | prestamos | `today` |
| Préstamo vencido | Equipo prestado cuya fecha de devolución es anterior a hoy. | prestamos | `OverdueLoan` |
| Historial | Lista de los préstamos de un equipo, del más reciente al más antiguo. | prestamos | `History` |
| Cuenta de IT | Correo incluido en la variable de entorno `CORREOS_IT`, comparado sin distinguir mayúsculas. | equipos, prestamos | `isItAccount` |
| Empleado | Persona con cuenta de Google de la empresa que no necesita ser de IT. | equipos, prestamos | `Employee` |
