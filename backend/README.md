# Food Store - Backend

Backend de consola del sistema Food Store desarrollado en Java con Gradle, JPA/Hibernate y base de datos H2.

## Funcionalidades principales
- Menú interactivo para gestionar categorías, productos, usuarios y pedidos.
- Baja lógica para categorías y productos.
- Relaciones JPA y líneas de detalle para pedidos.
- Consultas JPQL y reportes básicos.
- Persistencia con H2 en archivo.

## Requisitos
- Java 17 o superior
- Gradle

## Ejecución
Desde la carpeta del backend:

```bash
./gradlew run
```

En Windows:

```bash
gradlew.bat run
```

También se puede ejecutar desde IntelliJ abriendo `src/main/java/com/tp/jpa/Main.java` y presionando el botón verde de Run.

## Punto de entrada
La aplicación inicia desde la clase `com.tp.jpa.Main`.

## Notas
- La base de datos se almacena localmente mediante H2.
- Este módulo corresponde a la parte de consola de la entrega final.
