---
title: "Detras de Escena - Parte 4 - Mea Culpa"
date: 2023-02-19T10:11:45+01:00
---

En esta sección vamos a analizar dos casos que hacen a la seguridad del proyecto. En el primero vamos a analizar un posible escenario de fraude que es importante tener presente para intentar evitarlo. En el segundo, vamos a analizar una vulnerabilidad que encontramos en el proyecto, que ya fue reparada, pero que nos pareció interesante compartir por su moraleja.

La idea detrás de *Mea Culpa* no es dar a conocer problemas que alguien pueda intentar utilizar para atacarnos, sino ser transparentes con las dificultades que el proyecto presentó, cómo se solucionaron y para esos casos en donde el escenario sigue vigente, dar herramientas y hacer conscientes a los usuarios para que ellos tengan la posibilidad de evitarlos.
Esconder los problemas nunca es buena idea.

## FrontRun & Scam ##

Supongamos el siguiente escenario: Bob tiene un token que pertenece al grupo A de los tokens que delatan al capitán #5 y nosotros tenemos un token del grupo B para el mismo capitán. El capitán #5 aún no fue reclamado por lo que nosotros queremos comprar el token de Bob para poder ejecutar el reclamo. Bob nos lo vende por alguna plataforma de Marketplace pero cuando lo recibimos nos damos cuenta que el capitán #5 ya fue reclamado por el mismo Bob. Que paso?

Claro que para que esto ocurra Bob tiene que haber tenido también un token del grupo B para el capitán #5, sino no podría ocurrir.

Lo que Bob hizo fue esperar que nosotros iniciemos la compra del token y que la transacción de esa operación se envíe al Pool de transacciones de Ethereum. Las transacciones en el pool de Ethereum son transacciones pendientes de ser ejecutadas pero aún no fueron incluidas en ningún bloque por lo que el token, hasta que esa transacción no esté en la Blockchain, sigue siendo de Bob.\
De forma automática y como respuesta al inicio de la compra, Bob lanzó otra transacción pero en este caso para reclamar el token #5. Para asegurarse que su transacción se ejecute primero, Bob ha pagado más **maxPriorityFeePerGas** que el pagado por nosotros, priorizando así su transacción sobre la nuestra. Al cabo de un rato, su transacción fue incluida mientras la nuestra espera y para cuando la nuestra es finalmente incluida en un bloque de la Blockchain, el token del capitán #5 por el que compramos ese token a Bob, ya no está disponible y lo tiene Bob. Entonces Bob no solo se hizo con el capitán #5 sino que también realizó una venta en el proceso. Esto es lo que se conoce en la seguridad de Blockchains como **FrontRun**.

Si bien es un escenario un poco difícil de darse , no es imposible. El mayor riesgo que corre Bob es que alguien mas reclame el capitan #5 mientras él espera la venta de su token.

Como parte del proyecto existe un panel llamado [Rovers Registry](https://www.buccaneercircus.io/registry.html) que expone de forma sintética toda la información que pueda hacer falta conocer sobre el estado de *BuccaneerCircus* y sus contratos, quien tiene qué tokens, el estado de los mismos y la posibilidad de consultar cierta información. Todo esto puede darnos algo de ayuda al momento de querer concretar una operación ya que, si por ejemplo, Bob tuviese los dos tokens necesarios para hacer un reclamo, esto se podría saber utilizando el panel y eso ya sería algo sospechoso. Existen de cualquier manera, algunas otras tretas que Bob podría realizar para evitar esos chequeos, pero haría algo más complejo su fraude.

Rovers Registry se encuentra en funcionamiento pero aún lo seguimos mejorando con más funcionalidades.

## Vulnerabilidad en cleanPayments() ##

Todas las funciones de todos los contratos de *BuccaneerCircus* fueron auditadas varias veces antes de ser puestas en funcionamiento en la mainnet de Ethereum, pero a veces los problemas igual ocurren. Por suerte el problema pudo ser resuelto y hoy es una anécdota interesante para contar, no solo como una autocrítica sino también para mostrar que los errores ocurren y que la seguridad es una de nuestras prioridades.

La función *cleanPayments()* descrita durante el análisis del contrato *MarquisBanquete.sol* es la versión corregida de la que fue la función original, la cual se veía así:

```solidity
238   function cleanPayments() public {
239       uint256 paymentIndex = 0;
240
241       while(paymentIndex < allPaymentIds.length) {
242           Payment memory _payment = payments[allPaymentIds[paymentIndex]];
243
244           if(_payment.expirationBlock >= block.number) {
245               paymentIndex++;
246               continue;
247           }
248
249           allPaymentIds[paymentIndex] = allPaymentIds[allPaymentIds.length - 1];
250           allPaymentIds.pop();
251
252           bountyBalance += _payment.amount;
253       }
254   }
```

Esta versión no parece muy diferente a la actual, pero tiene una diferencia clave: Borrar y Reembolsa en el bounty todos aquellos pagos que, como única condición, hayan expirado.

El problema ocurrió puntualmente al agregar la línea 252 al contrato sin estudiar sus implicancias.\
Sin esa línea, la función simplemente elimina todos los *Payments* expirados incluidos los que no fueron pagados, generando un desbalance en el contrato que hace que el mismo finalmente tuviese **más Ethereum del que indicaba la variable *bountyBalance***, sin que este se pudiese recuperar.\
Ahora, con la línea 252 agregada, se pretendía reembolsar ese Ethereum al bounty pero se introdujo una vulnerabilidad en el proceso. Con esa nueva línea los pagos expirados eran reembolsados pero no solo si no habían sido pagados, sino también cuando ya lo habían sido. En otras palabras, los pagos que ya habían sido efectuados no debían ser devueltos al bounty porque ese ethereum ya no existía, pero de todas maneras se lo hacía.\
Entonces ahora **la variable *bountyBalance* podría estar indicando más ethereum que el que realmente había en el contrato**, lo que permitiría a un atacante por ejemplo, invocar a *shuffle()*, obtener el 1% de *bountyBalance* por llave a procesar y extraer mucho más en el proceso que lo que realmente corresponde.

Este fue el único cambio existente de este tipo en los contratos, pero sirve para dejar claro que los contratos deben ser muy bien observados, incluso ante los cambios más minúsculos.

## Conclusion ##

*BuccaneerCircus* es un proyecto que nos dejó muchas experiencias en todo lo que implicó, y alimentó en el proceso nuestro gusto por estas tecnologías. La idea es seguir construyendo sobre esto muchas más cosas y poder, como intentamos hacer hasta aquí, compartir con todos la experiencia lograda en el desarrollo.