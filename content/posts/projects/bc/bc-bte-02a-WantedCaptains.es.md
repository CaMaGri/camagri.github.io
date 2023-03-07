---
title: "Detras de Escena - Parte 3A -  WantedCaptains.sol"
date: 2023-02-12T12:03:16+01:00
---

Como mencionamos en la sección **Historias**, Wanted se centra en obtener dos tokens especiales que delatan a un capitán específico para así obtener el derecho a reclamar el token de dicho capitán.\
Al comienzo de esta sección analizamos cómo funcionan los secretos en *BuccaneerCircus* y cómo a través de estos podemos saber si un token es especial o no. Empecemos entonces por analizar la función que nos permite saber si alguno de nuestros tokens es delator de algún capitán.

```solidity
function isValidSecret(
    uint248 captainId,
    uint8 groupId,
    uint256 tokenId,
    bytes32 secret
)
    public view returns (bool)
{
    require(groupId < 2, "Group ID should be 0 or 1");
    uint256 index = (captainId * 10) + groupId;

    bytes32 hash = keccak256(abi.encodePacked(tokenId, secret));

    return captainValidHashes[index][hash];
}
```

**isValidSecret()** es una función muy simple que se encarga de validar si un token y su secreto, corresponden al delator de un capitán, para un grupo específico de ese capitán. Recordemos que para cada capitán existen dos grupos de delatores, A y B, que dentro del contrato son conocidos como grupos 0 y 1 respectivamente. Entonces, la función calcula el *hash* **keccak256** a partir de *tokenId* y de *secret* y únicamente devuelve *true* si el resultado existe como una de las entradas definidas para ese capitán y grupo. Cabe destacar que esta función no hace ningún tipo de control sobre si poseemos el token o no. Controlar esto es responsabilidad de quien la utiliza.

```solidity
function claim(
    uint256 captainId,
    uint256 tokenId_0,
    bytes32 secret_0,
    uint256 tokenId_1,
    bytes32 secret_1
)
    public
{
    require(!claimedCaptains[captainId], "captain already claimed");
    require(
        mainContract.ownerOf(tokenId_0) == _msgSender(),
        "no owner of tokenId_0"
    );
    require(
        mainContract.ownerOf(tokenId_1) == _msgSender(),
        "no owner of tokenId_1"
    );

    require(
        isValidSecret(uint248(captainId), 0, tokenId_0, secret_0),
        "tokenId is not member of group 0 for captainId"
    );
    require(
        isValidSecret(uint248(captainId), 1, tokenId_1, secret_1),
        "tokenId is not member of group 1 for captainId"
    );

    // Mark the captain as claimed to avoid reentracies
    claimedCaptains[captainId] = true;

    // Starts captain transfer to claimer
    mainContract.safeTransferFrom(address(this), _msgSender(), captainId);
}
```

Con dos tokens en nuestro poder que cumplan las condiciones para realizar el reclamo de un capitán, estamos listos para invocar la función **claim()**. Esta función recibe como parámetros por un lado, el ID del capitán que queremos reclamar y por otro, el ID del token más el secreto, de los dos tokens que pretendemos usar como delatores.\
Analizando la función, lo primero que notamos es que, además de confirmar que el capitán no haya sido reclamado, lo que se controla es que seamos los propietarios de los tokens que intentamos utilizar. Esto es así para evitar un ataque de *FrontRun*, algo que discutiremos en otra sección justo a otros aspectos de seguridad.

Sabiendo que los tokens nos pertenecen, lo siguiente que el contrato hace es validar, a través de la función *isValidSecret()*,  si estos y sus secretos corresponden a valores conocidos para el capitán y sus dos grupos. En caso afirmativo, el capitán es marcado como reclamado y luego transferido a quien invocó la función.

Existen otras funciones que componen el contrato pero que no ayudan al entendimiento de la lógica del mismo. Para más detalles sobre el funcionamiento los invitamos a leer los códigos completos que encontrarán en el [GitHub](https://github.com/CaMaGri/BuccaneerCircus) del proyecto.