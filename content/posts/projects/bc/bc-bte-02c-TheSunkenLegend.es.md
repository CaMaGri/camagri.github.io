---
title: "Detras de Escena - Parte 3C - TheSunkenLegend.sol"
date: 2023-02-19T10:06:22+01:00
---

Por mucho este fue el desafío más ambicioso pero también el más divertido de implementar. Como son varias las cosas que este contrato realiza, vamos a analizar casos de uso e ir explicando las funciones que se van ejecutando en el proceso.

Comencemos por analizar el caso de uso típico: Juntar las cuatro llaves y reclamar el bounty.

1. Cuando minteamos un token que posee una llave, lo que en realidad ocurre es que el token no tiene la llave, sino que tiene el derecho a reclamarla. Este derecho a reclamar la llave está implementado en la función **claimKey()** utilizando los secretos de la misma manera en como se los utilizó en los contratos anteriores. Entonces, lo primero que debemos hacer es reclamar la llave para luego estar en condiciones de transferirla o utilizarla. Notar que esto se realiza una única vez.

2. Para acceder al *bounty* las cuatro llaves deben existir bajo una misma wallet, ya sea en uno o varios tokens, y para esto necesitamos poder transferirlas.\
Nada impide que un token tenga más de una llave pero lo que sí debemos saber es que las llaves no pueden ser transferidas entre tokens que se encuentren en diferentes cuentas. Esto se implementó así para evitar transferencias accidentales de la llave a terceros.\
Otra restricción existente en la transferencia de las llaves es que estas no pueden ser transferidas en plazos inferiores a una hora. Esta segunda restricción existe para que en caso de que alguien quiera enviar un token a un tercero diciendo que tiene la llave, el tercero pueda saber de cuánto tiempo dispone antes de que el propietario pueda volver a transferir la llave. Con esto se le brinda algo de ventaja a un comprador para que pueda adquirir una llave sin estar expuesto a un ataque de *FrontRun* que le quite la misma durante la transferencia del token.

    ```solidity
    function transferKey(
        uint256 keyId,
        uint256 toTokenId
    )
        public whenNotShuffling
    {
        require(keyId < 4, "invalid keyId");
        require(
            mainContract.ownerOf(keys[keyId].ownerTokenId) == address(msg.sender),
            "key owner error"
        );
        require(
            mainContract.ownerOf(toTokenId) == address(msg.sender),
            "toTokenId error"
        );
        require(
            block.number.sub(keys[keyId].changeBlockNumber) > ONE_HOUR_BLOCKS,
            "one transfer x hour"
        );
        require(
            keys[keyId].ownerTokenId != toTokenId,
            "already own the key"
        );

        keys[keyId].changeBlockNumber = block.number;
        keys[keyId].ownerTokenId = toTokenId;
    }
    ```
    En la implementación de la función **transferKey()** podemos ver las cinco condiciones que describen lo antes mencionado: que seamos propietarios del token que posee la llave y del token al que la transferimos; Que haya pasado una hora aproximadamente (~ 300 bloques) desde la última vez que se la transfirió y que el token destinatario no sea el token que posee la llave. Con estas condiciones satisfechas, la función marca el bloque actual como punto de cambio y el token destino como nuevo propietario.

3. Con las cuatro llaves bajo la misma wallet, estamos en condiciones de reclamar el bounty. La función responsable de esto es **claimBounty()** la cual no tiene parámetros.
    ```solidity
    function claimBounty() public whenRunning whenNotShuffling {
        require(bountyBalance > 0, "no balance to claim");


        uint256 _rewardAmount = bountyBalance;
        bountyBalance = 0;


        for(uint8 keyId = 0; keyId < 4; keyId++) {
            require(
                mainContract.ownerOf(
                    keys[keyId].ownerTokenId
                ) == address(msg.sender),
                "not key owner"
            );
            keys[keyId].shuffle = true;
        }


        _requestShuffle(_rewardAmount, address(msg.sender));
    }
    ```
    La función controla que seamos los propietarios de los tokens que poseen las llaves, marcando las llaves como *"shuffle"* en el proceso, para luego invocar a la función **_requestShuffle()**. Marcar las llaves como *"shuffle"* sirve para que, una vez se generen los números aleatorios, la función de callback que los recibe pueda saber qué llaves deben ser redistribuidas y cuáles no. Por estar reclamando el bounty, todas las llaves serán redistribuidas, pero como analizaremos más adelante existen casos donde no es así.

4. En este punto es donde las cosas se ponen un poco más complicadas. La función *_requestShuffle()* es la encargada de invocar la función externa **requestRandomWords()** que dispara la generación de números aleatorios. Una vez generados los números la función **fulfillRandomWords()** es invocada con los resultados, dando continuidad al proceso.
Para conocer mas sobre el funcionamiento de *VRF (Verifiable Random Function)* de *ChainLink*, les dejamos el siguiente [link](https://blog.chain.link/verifiable-random-function-vrf/)

    ```solidity
    function _requestShuffle(
        uint256 _amount,
        address _to
    )
        private
    {
        require(subscriptionId > 0, "VRF no set up");
        shuffleStartBlock = block.number;

        shuffleRequestId = vrfCoordinatorIface.requestRandomWords(
            keyHash,
            uint64(subscriptionId),
            3,
            200000,
            1
        );

        payments[shuffleRequestId] = Payment({
            approved: false,
            paid: false,
            amount: _amount,
            to: _to,
            expirationBlock: (block.number + (ONE_HOUR_BLOCKS * 24 * 7))
        });

        userPaymentIds[_to].push(shuffleRequestId);
        allPaymentIds.push(shuffleRequestId);
    }
    ```
    Como valor de retorno de la función *requestRandomWords()* obtendremos un ID que será el identificador de este contexto de *shuffle*. En el código observamos que antes de realizar cualquier ejecución lo primero que se hace es almacenar el número de bloque actual en la variable **shuffleStartBlock**. Esta variable es utilizada por el modificador **whenNotShuffling**, implementado en varias funciones, para saber si existe corriendo un proceso de shuffle o no, evitando que más de uno se ejecute a la vez.

    Una vez tenemos el identificador del requerimiento de números aleatorios, lo siguiente es crear una instancia de Payment que será almacenada utilizando el identificador como índice. Los payments son el medio a través del cual el contrato sabe a quién le debe pagar, cuánto le debe pagar,  si el pago esta aprobado o no, si fue pagado o no y cuando ese pago expira. Con toda esa información en el objeto y habiendo guardado algunas referencias para facilitar el acceso al mismo, estamos listo para finalizar la función y dar lugar a la espera de la invocación de la función de callback *fulfillRandomWords()*.

5. Durante el tiempo que el contrato espera la invocación de la función de callback *fulfillRandomWords()*, éste permanece parcialmente bloqueado para las funciones que aplican el modificador *whenNotShuffling()*

    ```solidity
    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    )
        internal override
    {
        if (requestId != shuffleRequestId)
            return;

        uint256 randomWord = randomWords[0];

        for(uint8 keyId = 0; keyId < 4; keyId++) {
            if (keys[keyId].shuffle) {
                keys[keyId].ownerTokenId = randomWord.mod(
                    mainContract.totalSupply()
                );
                randomWord = randomWord >> 16;
                keys[keyId].shuffle = false;
                keys[keyId].changeBlockNumber = block.number;
            }
        }

        payments[requestId].approved = true;
        shuffleStartBlock = 0;
    }
    ```
    La función *fulfillRandomWords()* únicamente se ejecutará cuando se la invoque intentado satisfacer el último requerimiento que se hizo. Si una función de shuffle nunca se completa y excede el tiempo límite de espera (24 horas), entonces otra función de *shuffle* podría ejecutarse, quitándole la posibilidad a la primera, de finalizar. Eso puede ocurrir por ejemplo, porque la suscripción en *ChainLink* no tiene fondos o por alguna otra razón. Más allá del motivo, lo que se necesita saber aquí es que el callback es esperado solo por un día y de no completarse se da lugar a que nuevas solicitudes se generen para reemplazar esta. Las solicitudes que no pudieron completarse, no son marcadas como aprobadas y serán luego eliminadas durante la invocación de la función *cleanPayments()*, incrementando el balance del bounty para incorporar el monto del pago vencido.

    Con el número aleatorio recibido por la funcion *fulfillRandomWords()*, se itera sobre las cuatro llaves para conocer cuales fueron marcadas como *shuffle*, asignando en los casos positivos, un nuevo poseedor en base al número aleatorio, el bloque actual como momento de cambio y marcando la propiedad *shuffle* a falso.

    Al finalizar, el pago correspondiente al requerimiento es aprobado y la variable *shuffleStartBlock* es puesta a cero, para permitir que otro proceso de *shuffle* tenga lugar.
    
6. Con el *Payment* aprobado, estamos listos para reclamarlo. Invocando la función **getUserPayments()** y especificando la dirección de nuestra wallet, podemos saber en qué estado se encuentra nuestro pago, incluido el hecho de si está aprobado o el monto del mismo.\
Para poder hacernos del Ethereum del pago ya aprobado, debemos invocar la función **claimPayment()** indicando el ID del pago a ejecutar. 

    ```solidity
    function claimPayment(uint256 paymentId) public {
        require(
            payments[paymentId].approved && !payments[paymentId].paid,
            'not approved or already paid'
        );
        require(
            payments[paymentId].to == address(msg.sender),
            'payment owner error'
        );
        require(
            payments[paymentId].expirationBlock >= block.number,
            'expired payment'
        );

        payments[paymentId].paid = true;


        (bool success, ) = payments[paymentId].to.call{
            value: payments[paymentId].amount
        }("");
        require(success, 'transaction error');
    }
    ```
    *claimPayment()* controlará que el pago esté aprobado y no haya sido ya pagado, que el destinatario del pago seamos nosotros y que el pago no haya ya expirado. Con estas condiciones satisfechas, el mismo es marcado como pagado para evitar llamadas reentrantes y luego se ejecuta la transferencia del monto indicado.\
    Algunas cosas a notar en este punto: Podemos estar recibiendo un monto menor a la cantidad de dinero que el contrato tiene al momento de invocar *claimPayment()*, ya que el pago se define al momento de invocar la función *claimBounty()* y no al invocar *claimPayment()*. Podemos tener varios pagos pendientes siempre y cuando estos no tengan más de una semana desde su creación.

7. Por último, la función **cleanPayments()** trabaja como una suerte de *Garbage Collector*, recuperando el balance de todos aquellos pagos que vencieron y no fueron pagados.

    ```solidity
    function cleanPayments() public {
        require(cleanPaymentsIndex < allPaymentIds.length);
        require(
            payments[allPaymentIds[cleanPaymentsIndex]].expirationBlock < block.number,
            "no expired payments"
        );

        for(; cleanPaymentsIndex < allPaymentIds.length; cleanPaymentsIndex++) {
            Payment memory _payment = payments[allPaymentIds[cleanPaymentsIndex]];

            if(_payment.paid == true) {
                continue;
            }

            // Is It not expired?
            if(_payment.expirationBlock >= block.number) {
                break;
            }

            // If we are here is because the payment was not paid and It is expired
            bountyBalance += _payment.amount;
        }
    }
    ```
    La variable **cleanPaymentsIndex** referencia el próximo pago a procesado por *cleanPayments()* dentro de los pagos existentes en **allPaymentIds**. Cuando *cleanPaymentsIndex* referencia un pago que ha expirado pero que no ha sido pagado, la función suma al balance del bounty el monto del mismo antes de continuar con la siguiente entrada. Al final la función se detendrá cuando no haya más pagos que procesar o cuando el pago referenciado aun no este vencido ni pagado.

Hasta aquí hemos analizado el caso de uso típico de este contrato, dejando fuera del análisis solo algunas funciones que veremos a continuación.

El siguiente caso a analizar consiste en la invocación de la función **shuffle()** para movilizar aquellas llaves que permanecieron un periodo mayor a un mes en un mismo token, sin ser transferidas.

1. Este contexto es bastante diferente al del primer caso de uso analizado ya que aquí ni siquiera hace falta que tengamos un token para invocar la función.

    ```solidity
    function shuffle() public whenRunning whenNotShuffling {
        uint128 keysToShuffle = 0;
        uint128 keyId = 0;
        uint256 _rewardAmount;

        for(; keyId < 4; keyId++) {
            keys[keyId].shuffle = (
                block.number.sub(
                    keys[keyId].changeBlockNumber
                ) > (ONE_HOUR_BLOCKS * 24 * 30)
            );
            if (keys[keyId].shuffle)
                keysToShuffle += 1;
        }

        if (keysToShuffle == 0)
            revert("no keys to shuffle");

        // In this case, 1% of bounty per key, is paid as reward
        _rewardAmount = bountyBalance.div(100).mul(keysToShuffle);
        bountyBalance -= _rewardAmount;

        _requestShuffle(_rewardAmount, address(msg.sender));
    }
    ```
    La única condición que se tiene que dar para invocar la función *shuffle()* es que existan llaves que tengan por lo menos un mes desde la última vez que se las transfirió. Con esta condición satisfecha, se calcula un premio del 1% del total del bounty por cada llave, que será pagado siguiendo la misma mecánica que en la función *claimBounty()*

2. Como recordarán del caso de uso anterior, cuando analizamos la función *claimBounty()*, ésta marcaba todas las llaves como *shuffle* y mencionamos que eso no iba a ocurrir siempre. Es en este punto donde eso cambia. En la función *shuffle()* las únicas llaves marcadas para ser redistribuidas son aquellas que cumplen la condición de no haber sido transferidas, mientras que las demás permanecen sin cambios.

3. Luego de la ejecución de la función *shuffle()*, el proceso de obtención de la recompensa es exactamente el mismo que se sigue para el pago del bounty, por lo que sus pasos se remiten a entender el análisis anterior.

Y con este último análisis damos por terminada la descripción de los contratos. Leer el código de los mismos siempre es la mejor manera de entender la totalidad de su funcionamiento, pero muchas veces ocurre que el código por sí solo no es representativo del caso de uso, y si bien uno puede formarse una idea de lo que hacen, conocer el "para qué" de esa lógica hace más fácil el entendimiento del contrato.

Como parte final de esta serie de documentos vamos a  incluir lo que llamamos *Mea Culpa:* una sección dedicada a discutir cuestiones de seguridad relacionadas al proyecto, puntualmente a los contratos.