---
title: "Detras de Escena - Parte 3B - TheCursedOne.sol"
date: 2023-02-18T12:05:16+01:00
---

*TheCursedOne* es un contrato que guarda muchas similitudes en su funcionamiento con *WantedCaptains* salvo por algunos detalles que vamos a analizar. Recordemos que en *TheCursedOne* solo existe un token que podemos reclamar y para ellos debemos obtener tokens que conozcan las ocho estrofas que componen el poema que intentamos completar. El otro detalle es que esas estrofas deben ser anotadas y al momento de pronunciar el poema debemos aún poseer por lo menos cuatro de los ocho tokens que nos las proporcionaron. Suena más complejo de lo que realmente es. Analicemos algunas funciones para aclarar un poco esto:

```solidity
mapping(address => mapping(uint256 => uint256)) private seenTokens;

...

function setSeenToken(
    uint8 groupId,
    uint256 tokenId,
    bytes32 secret
)
    public
{
    require(
        mainContract.ownerOf(tokenId) == _msgSender(),
        "you must be the token owner"
    );
    require(
        _isValidSecret(groupId, tokenId, secret),
        "invalid group member"
    );

    seenTokens[_msgSender()][groupId] = tokenId;
}
```

La función **setSeenToken()** es la función que se invoca al momento de "anotar" una estrofa del poema. Como vemos, la función primero controla que poseamos el token que decimos tener, luego valida que su secreto corresponda a la estrofa que intentamos anotar (las estrofas dentro de este contrato se conocen como *groupId*) y siendo verdaderas estas condiciones, guardará el *tokenId* como referencia para la estrofa que marcamos.\
Esta función debería ser llamada por lo menos ocho veces con diferentes tokens que completan las ocho estrofas (los grupos del 1 al 8). Cabe aclarar que podemos sobreescribir una entrada ya establecida con otro token, siempre y cuando este último cumpla las condiciones del grupo.

Con las 8 entradas completas y en poder aún por lo menos de cuatro de los ocho tokens, podemos dar inicio al reclamo.

```solidity
function claim() public {
    require(!claimed, "Deken was already claimed");

    uint8 stillOwned = 0;
    for(uint8 groupId = 1; groupId <= 8; groupId++) {
        uint256 tokenId = seenTokens[_msgSender()][groupId];
        require(
            tokenId != 0,
            "not all groups seen"
        );


        if (mainContract.ownerOf(tokenId) == _msgSender())
            stillOwned += 1;
    }

    require(
        stillOwned > 3,
        "you must still own more than 3 tokens"
    );

    // Mark the captain as claimed to avoid reentracies
    claimed = true;

    // Starts Deken transfer to claimer
    mainContract.safeTransferFrom(
        address(this),
        _msgSender(),
        0
    );
}
```

En esta implementación de **claim()**, se controla en las ocho iteraciones que se hacen (una por grupo) que hayamos establecido un *tokenId* para cada grupo, incrementando en el proceso un contador en los casos donde aún seamos poseedores del token. Si al final del loop poseemos por lo menos 4 de los 8 tokens, entonces el token es marcado como reclamado y este transferido a la dirección de quien ejecutó la función.

Con esto concluimos el análisis de los primeros dos desafíos de *BuccaneerCircus*. El siguiente y último requiere un análisis un poco más extenso pero muy interesante de leer.