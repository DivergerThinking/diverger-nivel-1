# Entorno de staging en el proyecto de pruebas del harness. Nada de esto es secreto.
# Una aplicación creada desde la plantilla cambia «aplicacion» por su nombre (y el prefijo de
# staging.gcs.tfbackend, para que su estado no pise el de otra).
proyecto         = "diverger-exp-harness"
region           = "europe-west1"
aplicacion       = "nivel-1"
cuenta_ejecucion = "diverger-run@diverger-exp-harness.iam.gserviceaccount.com"

# Despliegue continuo con Cloud Deploy (EN-FM-04): la cuenta y el almacén los crea gcp.sh del harness.
cuenta_cloud_deploy  = "diverger-clouddeploy@diverger-exp-harness.iam.gserviceaccount.com"
almacen_cloud_deploy = "gs://diverger-exp-harness-clouddeploy"

# Las aplicaciones de prueba se crean y se tiran en cada ejecución del nivel 0 y del nivel 1.
proteccion_borrado = false

# Inicio de sesión con Google (ADR 0004 del harness): el ID del cliente OAuth «Aplicación web» del
# proyecto de pruebas, el mismo para todas las aplicaciones de staging. No es un secreto. Sin él, la
# API protegida responde 503, y el validador en staging, que pide un token de identidad con esta
# audiencia, no puede entrar (EN-FM-03, ADR 0020 del harness). El cliente se crea en la consola de
# Google Cloud (Google Auth Platform > Clientes), con audiencia interna. Cada aplicación de staging
# añade su URL a los orígenes autorizados de JavaScript del cliente; sin ella, el botón de inicio de
# sesión no funciona en el navegador (el validador no lo necesita).
google_client_id = "856958240211-9odcnq6f4roe1er15rijo624ht8ekjmd.apps.googleusercontent.com"

# Las cuentas de IT del nivel 1 (petición del nivel 1 del harness, EN-GP-07): la cuenta con la que entran
# el validador y el inventario, y la de la demo (harness#442). Solo correos que pueden ser públicos: este
# repositorio lo es.
variables_entorno = {
  CORREOS_IT = "diverger-validacion@diverger-exp-harness.iam.gserviceaccount.com,demo-it@diverger.ai"
}
