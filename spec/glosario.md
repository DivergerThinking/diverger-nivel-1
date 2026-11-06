# Glosario

| Término | Definición | Contexto | En el código |
|---|---|---|---|
| Equipo | Un aparato de la oficina que se presta: un portátil, un monitor o un proyector. Tiene un id que genera la aplicación y un nombre. | equipos | `Equipment` |
| Nombre del equipo | Texto que identifica al equipo para las personas, por ejemplo «Portátil 07». Es único sin distinguir mayúsculas ni espacios al principio o al final. | equipos | `name` |
| Nombre normalizado | El nombre sin espacios al principio ni al final y en minúsculas; dos equipos no pueden compartirlo. | equipos | `normalizedName` |
| Cuenta de IT | Una cuenta cuyo correo está en la variable de entorno `CORREOS_IT`, comparada sin distinguir mayúsculas. Puede hacer las operaciones «Solo IT». | equipos | `ItAccount` |
| Persona | El correo de quien hace una operación (el del token de la sesión) o de quien tiene un equipo. | prestamos | `person` |
| Estado del equipo | Uno de tres: `disponible`, `reservado` o `prestado`. | prestamos | `EquipmentStatus` |
| Disponible | Estado de un equipo que nadie tiene ni ha pedido. Es el de todo equipo recién dado de alta. | prestamos | `available` |
| Reservado | Estado de un equipo que una persona ha pedido y aún no ha recogido. | prestamos | `reserved` |
| Prestado | Estado de un equipo que IT ha entregado o prestado en el mostrador y aún no se ha devuelto. | prestamos | `lent` |
| Solicitud | Petición de una persona para llevarse un equipo disponible; lo deja reservado a su nombre. | prestamos | `Request` |
| Entrega | Paso en el que IT da a la persona un equipo reservado, que pasa a prestado con la misma persona y fecha de devolución. | prestamos | `Handover` |
| Préstamo en el mostrador | Préstamo que IT hace directamente a una persona, sin solicitud previa. | prestamos | `CounterLoan` |
| Préstamo | Cada vez que un equipo pasa por las manos de una persona, desde la solicitud o el préstamo en el mostrador hasta su devolución. Es la unidad del historial. | prestamos | `Loan` |
| Devolución | Paso en el que IT apunta que un equipo prestado ha vuelto; el equipo queda disponible. | prestamos | `Return` |
| Fecha de devolución | Día en que la persona devolverá el equipo, como texto `AAAA-MM-DD`; tiene que ser una fecha que exista. | prestamos | `dueDate` |
| Hoy | El día en curso en Madrid (zona horaria Europe/Madrid). | prestamos | `today` |
| Préstamo vencido | Equipo prestado cuya fecha de devolución es anterior a hoy. | prestamos | `OverdueLoan` |
| Historial | La lista de los préstamos de un equipo, del más reciente al más antiguo, cada uno con su persona, su fecha de devolución y su estado (`reservado`, `prestado` o `devuelto`). | prestamos | `LoanHistory` |
| Devuelto | Estado de un préstamo del historial cuyo equipo ya se ha devuelto. | prestamos | `returned` |
