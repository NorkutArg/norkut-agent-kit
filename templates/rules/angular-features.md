---
stacks: [angular]
paths:
  - "src/app/**/*.ts"
---
# Angular
- Componentes de feature consumen servicios de Front-Core; no duplicar lógica compartida.
- Todo request al backend pasa por el interceptor de tenant.
- Estado que depende de eventos backend: mostrar estado "pendiente" hasta confirmación, nunca asumir lectura inmediata.
