## Recomendaciones a aplicar
                                                                 
  Estado general

  La aplicación es funcional y está bien estructurada. La lógica de  
  negocio (alertas, recordatorios, notas, secuencias) tiene buena    
  cobertura de tests. Pero hay puntos que conviene atender para      
  evitar problemas conforme la uses más.

  ---
  1. COSAS QUE PUEDEN FALLAR EN USO REAL

  El barrido puede quedarse colgado si el servidor tarda mucho       
  Cuando TareaLog sincroniza con Gmail, hace una petición al backend 
  sin límite de tiempo. Si el servidor de Google tarda más de lo     
  normal (o hay muchos correos), la extensión se queda esperando     
  indefinidamente sin avisarte.
  Recomendación: Poner un tope de 5 minutos. Si no responde, cancelar   y reintentar en el siguiente ciclo.

  Si llegan muchos correos nuevos de golpe, puede dar timeout        
  El backend procesa TODOS los mensajes nuevos uno por uno,
  escribiendo cada uno en la hoja. Con 200+ correos nuevos (por      
  ejemplo un lunes tras vacaciones), Google Apps Script puede superar   su límite de 30 segundos y fallar.
  Recomendación: Procesar en lotes de 50 mensajes máximo. Lo que     
  quede se procesa en el siguiente barrido.

  Los cambios en la tabla se guardan localmente antes de confirmarse 
  en el servidor
  Cuando editas una fase o estado, TareaLog actualiza tu pantalla    
  inmediatamente pero envía el cambio al servidor "en segundo plano".   Si el servidor falla (sin conexión, error), tú ves el cambio pero 
  no se guardó realmente.
  Recomendación: Mostrar un indicador si el guardado en servidor     
  falló, para que puedas reintentar.

  El envío masivo con muchos destinatarios puede dar timeout
  Si programas respuestas a 30+ transportistas, el sistema espera    
  entre cada envío (para no bloquear Gmail). Con muchos
  destinatarios, el tiempo total puede superar el límite de Google.  
  Recomendación: Para envíos grandes (>15 destinatarios), dividir en 
  tandas automáticas.
