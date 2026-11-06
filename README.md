# diverger-nivel-1

Repo de evaluación del nivel 1 del harness Diverger ExP. La aplicación la genera el propio harness. Antes de cada ejecución de evaluación, `preparar-nivel.yml` del harness (con `nivel: 1`) lo deja con solo la plantilla `diverger-golden-path` y la petición fija del nivel 1 en `.diverger/inbox/peticion.md` (EN-GP-07, ADR 0021 del harness). Al terminar, `informe-nivel.yml` del harness ejecuta la suite de referencia, que solo está en el harness, contra su staging.

- Lo propio de este repositorio, que el reinicio conserva: `.diverger/settings.json`, `.github/CODEOWNERS`, este README y la configuración de staging de la aplicación `nivel-1` (`infra/staging.tfvars` e `infra/staging.gcs.tfbackend`). Los workflows son los de la plantilla; si cambian en la plantilla, el titular los actualiza aquí con una PR, porque la App no puede cambiar workflows.
- Lo prepara `infra/github/repo-nivel.sh` del harness, y la preparación de los entornos está en `infra/entornos/LEEME.md` de [Diverger-ExP-Harness](https://github.com/DivergerThinking/Diverger-ExP-Harness).

Es público a propósito: con el plan Free de GitHub, las protecciones de rama solo funcionan en repositorios públicos ([ADR 0001](https://github.com/DivergerThinking/Diverger-ExP-Harness/blob/main/docs/adr/0001-repos-de-prueba-publicos.md)). No contiene datos ni credenciales.
