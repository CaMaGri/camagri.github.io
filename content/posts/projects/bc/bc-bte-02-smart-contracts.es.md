---
title: "Detras de Escena - Parte 3 - Smart Contracts"
date: 2023-02-12T11:39:30+01:00
---

Los *Smart Contracts* son probablemente la parte más interesante y compleja del proyecto y es por eso que dedicaremos más tiempo a su entendimiento.

En lo que sigue explicaremos primero el concepto de **secreto** que es común a los tres contratos y luego analizaremos cada contrato por separado. Puede que se omitan algunas cuestiones muy técnicas, pero el análisis que realizaremos aquí es bastante más profundo que los anteriores, intentando con esto lograr una buena comprensión de la lógica de los contratos.

## Los Secretos ##

Al momento de escribir los contratos, uno de los problemas que surgió fue la necesidad de encontrar una manera de que estos pudiesen reconocer cuando un token era especial sin exponer la lista de tokens especiales en el proceso.

El problema con esto es que las blockchains son transparentes en la información que almacenan, lo que quiere decir que no importa la forma en la que guardemos un valor, si este no se oculta **antes** de ser utilizado en una transacción, el mismo puede ser conocido por cualquiera. Dicho de otra forma, no importa que guardemos esa información en una variables private por ejemplo, esta información, si bien no va a ser accesible por quien utiliza el contrato Si puede ser conocida analizando la blockchain. 

Una de las maneras más simples de ocultar información y que sea muy difícil de adivinar es aplicar una función de *hash* y almacenar el resultado para que solo quien conoce la entrada pueda volver a generar esa salida, pero esto no es una solución si esa entrada es predecible.\
En nuestro caso, lo que necesitamos es ocultar el token id de los tokens que son especiales y sí únicamente guardamos el *hash* de esos ids, sería muy fácil darse cuenta que *hashes* corresponden a que ids. Entonces, para solucionar este problema, se debía sumar algo más a la entrada del hash además del token id, algo que aumentase la dificultad para que los tokens especiales no sean descubiertos. Ahí es donde surge **"el secreto del token"**.

Cada token tiene un secreto que no es otra cosa que el *hash* del campo **"description"** de su metadata, siendo este el principal motivo por el cual la metadata de un token es revelada unicamente luego de su minteo. Solo cuando un token es minteado, su campo *"description"* y su campo *"image"* son revelados, impidiendo así que alguien pueda conocer de antemano su secreto y por lo tanto si es especial o no.

Conocer el secreto es solo el primer paso para acceder a las funciones del contrato, la segunda condición es poseer el token al que pertenece el secreto. Esta relación entre el token Id y el secreto se establece a través de otra función de hash aplicada sobre los dos elementos combinados, siendo este resultado el valor almacenado en el contrato.

![token-hash-generation](/posts/projects/bc/token_hash_generation.png)

En la imagen podemos ver el proceso a través del cual el valor almacenado en un contrato es calculado. Como es de esperar, keccak256 es la función de hash utilizada, la cual se aplica primero sobre el campo *"description"* de la metadata y luego sobre el resultado del encode entre el token id y el secreto.
Entonces para conocer si un token id es especial, primero debemos poder acceder al campo *"description"* de su metadata, calcular el hash como indicamos más arriba y comparar el resultado con los hashes almacenado en los diferentes contratos. En caso de que exista una coincidencia, sabremos entonces que nuestro token es especial.

Estos hashes los podemos encontrar en los tres contratos de cada historia de BuccaneerCircus indicando que tokens son especiales dentro del conjunto de tokens que poseemos.

Entendiendo la mecánica de los secretos estamos listos para comenzar el análisis de los contratos.

## BuccaneerCircus.sol ##

**BuccaneerCircus.sol** es el contrato principal y la base sobre la que funcionan los otros tres contratos. Si bien es un contrato simple que extiende la funcionalidad proporcionada por los contratos **ERC721Enumerable** y **Ownable** de *OpenZeppelin*, existen algunas funciones que fueron agregadas y que vale la pena analizar.

Las funciones de setup **setupBaseContracts()** y **setMarquisBanquetContract()** son las encargadas de establecer en este contrato, las direcciones de los otros tres contratos, pero además, para el caso de *setupBaseContracts()*, realizar el minteo de los 15 primeros tokens y enviar cada uno a la dirección que corresponde: el #0 al contrato *TheCursedOne*, los tokens del #1 and #10 al contract *WantedCaptains* y por último los tokens del #11 al #14 a la wallet del *team BuccaneerCircus*. Esto es así porque los tokens que representan la recompensa en alguna de las aventuras del proyecto, son gestionados por el mismo contrato que implementa la lógica del juego.

El minting en este contrato se ejecuta a través de la función **mintRovers()** que únicamente controla dos cosas antes de realizar el minteo: Que no se exceda el máximo de 16 tokens por transacción y que se esté enviando al contrato los *0.1 ether* por cada token que estemos intentando mintear. La lógica que sigue a estos controles está mayormente implementada en los contratos de los que se heredó.

La última función que analizaremos es la función de **withdraw()**. Esta función es la encargada de recuperar todo el Ethereum que el contrato posee y enviarlo a la dirección que se especifique como parámetro. Lo que hay que remarcar de esta función es que durante su ejecución, el 1% del total del Ethereum almacenado es enviado a la dirección del contrato del *Marquess's Banquet*, que fue previamente establecida en el setup, transfiriendo el remanente al destinatario del *withdraw*. Este 1% representa el primer lugar de donde el *Marquess's Banquet* obtiene su riqueza.

Los detalles sobre la implementación de este contrato pueden ser estudiados en el código del mismo. En lo que sigue analizaremos los restantes tres contratos intentando explicar lo mejor posible su funcionamiento sin caer en detalles técnicos que no contribuyan al entendimiento de los mismos.
