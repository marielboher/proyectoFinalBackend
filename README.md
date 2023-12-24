PROYECTO ECOMERCE BACKEND:

Dentro del profile de cada usario se podra encontrar la opcion de UPLOAD FILES, y de ADMIN CONTROLLER
Segun lo pedido a lo largo del curso solo los user pueden agregar productos al carrito y realizar una compra
- si se intenta agregarproductos al carrito o acceder al carrito siendo admin dara error 
- los usuarios premium no pueden agregar sus propios productos al carrito
- si se intentan eliminar usuarios siendo user o premiun no se podra
- si se intenta crear productos nuevos siendo user no se podra 
- solo los usuarios premium y admin estan autorizados para cargar productos nuevos 
 

en la ruta /apidocs se podra obtener informacion acerca de la documentacion para carts y products

para obtener todos los usuarios: /api/users
para eliminar usuarios inactivos: /api/users/inactive

