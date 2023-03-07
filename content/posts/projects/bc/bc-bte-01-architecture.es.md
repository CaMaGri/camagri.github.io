---
title: "Detras de Escena - Parte 2 - Arquitecture"
date: 2023-02-11T14:26:55+01:00
---

## Arquitectura ##

Una parte fundamental de *BuccaneerCircus* son los diferentes componentes de su arquitectura y cómo estos cooperan para que todo funcione.\
Entre los requerimientos que definen esta arquitectura, el más relevante es la **revelación progresiva de la metadata**, algo que tomará más sentido que exista cuando analizemos los smart contracts. Por el momento debemos saber que será necesario que algunos campos de la metadata permanezcan ocultos hasta que el token correspondiente sea minteado.\
Los demás requerimientos podrían ser definidos como:

* Servir el contenido estático del portal (html, imágenes, CSS, JavaScript).
* Encriptar la comunicación en todos los segmentos donde sea posible.
* Automatizar todas las tareas posibles.
* Utilizar IPFS para almacenar las imágenes y en el futuro, la metadata también.
* Interactuar con la blockchain y actualizar estados dentro de la arquitectura.
* ...

El siguiente diagrama es una referencia visual de los componentes y su relación.

![Architecture Preview](/posts/projects/bc/full_arch_v2.png)

Para tener una idea del rol de cada componente les proponemos analizar cómo se obtiene la metadata de un token, en este caso el #11, describiendo en el proceso cada etapa de su ejecución.

1. Lo primero que debemos conocer para obtener la metadata de un token es la URI en donde se encuentra. Esta URI se obtiene como resultado al invocar la función *tokenURI()* del contrato principal del proyecto ( *ERC721* ) con el ID del token como parámetro, lo que en nuestro caso retornaria "https://api.buccaneercircus.io/token/11".

2. Conociendo la URI  y habiendo iniciado el requerimiento, es probable que notemos que el dominio *api.buccanercircus.io* no resuelve a un host sino a *CloudFlare*.\
Varios de los dominios de *buccaneercircus.io* resuelven a *CloudFlare* ya que este es el servicio utilizado como proxy entre usuarios finales y los servicios de *AWS* sobre los que se corre buena parte del proyecto. Utilizamos *CloudFlare* para **reducir los costos de *AWS*** ya que funciona como caché de contenido, pero también facilita la implementación de certificados firmados, detección de ataques y otras cosas más, sin contar que es gratis para este tipo de casos de uso.

3. Habiendo el requerimiento pasado *CloudFlare* y ya dentro de la red de *AWS*, el siguiente componente que nos encontraremos es el *ApiGateway* que no es otra cosa que la solución de *AWS* para conectar URLs a funciones lambda. Dicho de otra manera, aquí se define qué requerimientos HTTP (path, querystring, metodo, etc) disparan la ejecución de que funciones lambda y como el resultado de esa ejecución es devuelto al usuario.\
En nuestro caso, el requerimiento **GET /token/{tokenId}**  deriva en la ejecución de la función lambda **get_token_metadata(token_id)** con el *token_id* como único parámetro.\
No está de más mencionar que el código de todas esta funcione como de todos los scripts del proyecto, los pueden encontrar en nuestro [GitHub](https://github.com/orgs/CaMaGri/repositories).

4. Entonces, volviendo a nuestro análisis, la función *get_token_metadata()* se encargará de tomar la metadata del token #11 desde *Private Bucket*, evaluar si debe esconder alguna información y generar una respuesta en base a lo anterior.

5. El *Private Bucket* es el bucket de *S3* donde se almacenan todos los archivos de la metadata (un archivo para cada token) además de un archivo que contiene información del estado en que se encuentran los tokens (cuales deben ser visibles o no) llamado **minting.json**.\
Los *Buckets* de *S3* son la forma que *AWS* nos proporciona para almacenar contenido en la nube y acceder a este de forma sencilla. El otro *Bucket* que existe en el proyecto es el *Public Bucket* que como su nombre indica tiene su contenido público, el cual no es otra cosa que los archivos que componen el portal de *BuccaneerCircus* (css, html, js, etc).

6. Al final del recorrido, la función *get_token_metadata()* devolverá un *JSON* correspondiente a la metadata, el cual se envía como respuesta a la petición HTTP, habiendo ocultado la información que haga falta, según el contexto.

En este análisis pudimos incluir la mayoría de las partes que componen el diagrama. Algunos componentes quedaron fuera del análisis, pero como son simples vamos a explicarlos individualmente.

*CloudFront* es una solución de *AWS* que utilizamos para implementar el acceso por HTTPs a los archivos que componen el portal. Los *Buckets* de *S3* ya implementan una solución para servir los archivos que contiene a través de un servicio HTTP, pero con el problema de que no soportan HTTPs.\
Una de las premisas que tuvimos desde el comienzo del proyecto, fue la seguridad y esto incluye mantener conexiones encriptadas y firmadas en todos los extremos de las conexiones, incluyendo lo que ocurre entre *CloudFlare* y *AWS*. Es un poco paranoico pero no queríamos que los requerimientos viajen en plano en ninguna instancia de la conexión. Así es que incluso el contenido de la web tiene un circuito completamente encriptado, desde el *Bucket* hasta el browser. Los accesos directos a los recursos de *AWS* también fueron deshabilitados.

Lo último que nos queda analizar es cómo la información que *get_token_metadata()* utiliza para saber que metadata ocultar y cual no, se mantiene actualizada. Comentamos más arriba que esto se conoce gracias a un archivo en formato JSON llamado *minting.json*, que se encuentra en el *Private Bucket*. La información que este archivo contiene es actualizada por un servicio externo que se encarga de realizar las consultas sobre la red *Ethereum* para luego reflejar esa información en *minting.json*. Esta actualización se realiza a través de un endpoint de la API que invoca a la función lambda **update_minting_info_json()** y que solo puede ser utilizado por este script ya que el acceso se encuentra restringido por una API Key que solo él conoce.

Veamos un diagrama para entender mejor la idea:

![update_minting_info_json_diagram](/posts/projects/bc/update_minting_json.png)
*(1) Request minting state. (2) Invoque API to make the update. (3) Overwrite minting.json*

En este punto uno se podría preguntar, y ¿Por qué no hacer que la función *get_token_metadata()* consulte directamente el estado de los tokens en lugar de que exista un servicio externo que actualice un archivo? El problema con esto es que los microservicios de *AWS* tienen un tiempo máximo de ejecución de 3 segundos y las llamadas JSON-RPC a *Ethereum* requeridas para conocer el estado de los token, no son tan rápidas.\
Todo lo anterior conlleva a que exista un delay entre los cambios ocurridos en el estado del *minteo* y el momento en que estos se reflejan en la revelación de la metadata, aunque esto no representa un problema.

Estos scripts corriendo remotamente y manteniendo la información de los tokens actualizada, no se ejecutan en *AWS* sino en una máquina virtual de la plataforma *Digital Ocean*. Se podría haber utilizado *EC2* de *AWS* pero *Digital Ocean* es una plataforma que ya conocíamos y que es muy simple de utilizar además de económica.

Con esto terminamos de analizar la idea general de cómo funciona el circuito de revelación progresiva de metadata del proyecto. Probablemente quedan detalles por conocer los cuales nos pueden consultar sin ningún problema, pero creemos haber logrado el objetivo de mencionar las tecnologías utilizadas y dar a conocer la arquitectura general del proyecto.\
En el siguiente artículo analizaremos los *smart contract* y su funcionamiento.