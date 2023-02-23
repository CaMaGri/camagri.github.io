---
title: "Detras de Escena - Parte 1 - Introducción"
date: 2023-02-11T23:59:35+01:00
---

## Comienzos ## 
A comienzos de 2021 tuvimos la idea de crear un juego aprovechando la tecnología de NFT para su implementación. Si bien muchas ideas surgieron, buena parte de ellas excedían en gran medida los recursos de tiempo y dinero de los que disponíamos para concretarlas. Sin embargo una idea nos gustó por su simplicidad y porque nos permitía realizar una primera aproximación a lo que buscábamos, con buenas probabilidades de concretarse. Así nació *BuccaneerCircus*, un proyecto en donde las historias contadas se potencian a través de la ilustración y el uso de smart contracts.
Más de un año pasó desde entonces pero hoy podemos mostrar contentos el resultado de todo ese esfuerzo.

El objetivo de esta serie de posts es compartir todo el conocimiento logrado durante el desarrollo del proyecto, tanto para los que sienten curiosidad sobre su implementación, como para aquellos que se embarcan en proyectos similares y necesitan una guía.

En esta primera parte explicaremos en qué consiste cada una de las aventuras, de forma muy sintética. El objetivo es formarnos una idea general de la consigna detrás de cada aventura que luego se convierten en los requerimientos para la implementación.
Luego hablaremos de la arquitectura, los diferentes componentes que interactúan en el proyecto y cómo estos ayudan a concretar la implementación.
Por último, vamos a explicar los Smart Contracts. Esta es la parte más técnica y apunta a conocer los detalles en la implementación de los contratos.

## Las Historias ##
Para entender bien no solo la arquitectura del proyecto sino también cómo funcionan los smart contracts, es recomendable tener una idea al menos básica, de la trama en las diferentes historias. Para lograr esto vamos a explicar brevemente en qué consiste cada historia y cuál es el objetivo del juego en cada caso.

### Wanted ###

![Wanted Captains](/posts/projects/bc/wanted_banner.png)

***Wanted** refleja las vivencias de los tripulantes con respecto a sus capitanes prófugos de la ley, y  no tanto de éstos últimos en sí. Los experimentados suelen saber contar de manera fiel los sucesos que llevaron a la condena de su líder, mientras que los grumetes desconocen los detalles y los juzgan peor. Y es en este cóctel de emociones que la falta de empatía forja las traiciones.*

El objetivo en Wanted es conseguir dos delatores de un mismo capitán para así poder entregar este a la justicia y obtener su token como recompensa.
Un detalle importante a tener en cuenta es que cada capitán tiene 8 delatores pertenecientes a dos grupos diferentes A y B. Para poder reclamar un capitán necesitamos que un delator sea del grupo A y el otro del grupo B.

### The Cursed One ###

![The Cursed One](/posts/projects/bc/the-cursed-one_banner.png)

*La leyenda detrás de **The Cursed One** nos cuenta la historia de un capitán que se atrevió a enfrentar al mismo Diablo y por su soberbia, fue condenado a navegar por siempre. Es de común saber para los isleños que no se debe cantar sobre este marino, pues es una invitación a que se aparezca, y pocos hay con vida que sepan contar cómo termina eso.*

El poema de The Cursed One está compuesto por ocho estrofas que deben ser escritas en un papel para ser recordadas. Este papel se encuentra en la cabina a la que accedemos por la puerta que se nos presenta en esta aventura, solo pudiendo acceder a ella si poseemos al menos un token de BuccaneerCircus.
Al final, con las ocho estrofas escritas y conservando al menos cuatro de los ocho token que nos las proporcionaron, estaremos listos entonces para pronunciar el poema, invocar a The Cursed One y obtener el token #0 de BuccaneerCircus.

### The Sunken Legend ###

![The Sunken Legend](/posts/projects/bc/the-sunken-legend_banner.png)

*Donde hay piratas, hay tesoros y BuccaneerCircus no es la excepción.
The Sunken Legend  trata de un marqués Francés que poseía vastas riquezas que parecían no tener fin, al punto de levantar sospechas. Asociado a su filantropía entre amigos, los locales hablaban del "Marquis' Banquet" para referirse a todo esto. Al momento de la muerte del hombre, sus propiedades fueron allanadas en busca de una explicación surreal para tanto dinero, pero ninguna fue jamás encontrada, creando así la leyenda.
Algunos cuentan que solo ciertas personas cercanas al marqués conocen el secreto para acceder a estas riquezas, las cuales surgirían del interior de un enorme cofre; lo cierto es que, quien logre posar sus manos sobre él, obtendría una fortuna ilimitada.*

Con esta leyenda inicia una de las aventuras más ambiciosas de BuccaneerCircus.
The Sunken Legend nos cuenta de un cofre llamado el Marquis' Banquet, el cual solo puede ser accedido si se poseen las cuatro llaves que lo abren. Estas cuatro llaves se encuentran distribuidas entre los tokens de BuccaneerCircus y como en las demás aventuras, solo sabremos si un token posee una llave, una vez este haya sido minteado.

Algunas cosas a destacar
* Las llaves pueden ser transferidas entre tokens siempre y cuando los tokens existan bajo una misma cuenta.
* Nada impide que un token posea más de una llave, incluso todas las llaves.
* Las llaves serán redistribuidas aleatoriamente entre todos los tokens de BuccaneerCircus, una vez el contenido del cofre sea reclamado.
* Por último, una llave también puede ser redistribuida si transcurre un periodo mayor a un mes sin que esta se haya transferido a otro token.

Al final deberemos tener todos los tokens que poseen llaves para acceder al Marquis' Banquet y a su contenido.

Para más detalles sobre las aventura o como participar de ellas, les recomendamos visitar el portal de BuccaneerCircus o bien escribirnos a través de Discord, Twitter o Instagram.

Hasta aquí hemos hecho una introducción al proyecto, analizando las historias y cómo participar de ellas. En lo que sigue daremos un vistazo a los diferentes componentes y tecnologías que forman el proyecto y cómo estos interactúan para lograr que todo funcione.

