package com.tp.jpa;

import com.tp.jpa.model.*;
import com.tp.jpa.model.enums.*;
import com.tp.jpa.repository.*;
import com.tp.jpa.util.JPAUtil;
import jakarta.persistence.EntityManager;

import java.time.LocalDate;
import java.util.*;

public class Main {

    static Scanner scanner = new Scanner(System.in);

    // Instanciación de todos los repositorios requeridos por el sistema
    static CategoriaRepository categoriaRepo = new CategoriaRepository();
    static ProductoRepository productoRepo = new ProductoRepository();
    static UsuarioRepository usuarioRepo = new UsuarioRepository();
    static PedidoRepository pedidoRepo = new PedidoRepository();

    public static void main(String[] args) {
        int opcion;
        do {
            System.out.println("\n====================================");
            System.out.println("    FOOD STORE - Menú principal    ");
            System.out.println("====================================");
            System.out.println("1. Gestión Categorías");
            System.out.println("2. Gestión Productos");
            System.out.println("3. Gestión Usuarios");
            System.out.println("4. Gestión Pedidos");
            System.out.println("5. Reportes");
            System.out.println("0. Salir");
            System.out.println("------------------------------------");
            System.out.print("Opción: ");
            opcion = leerOpcion();

            switch (opcion) {
                case 1 -> menuCategorias();
                case 2 -> menuProductos();
                case 3 -> menuUsuarios();
                case 4 -> menuPedidos();
                case 5 -> menuReportes();
                case 0 -> System.out.println("\nCerrando el sistema. ¡Hasta luego!");
                default -> System.out.println("\n[!] Opción inválida.");
            }
        } while (opcion != 0);

        JPAUtil.close();
    }


    // ---- 1. Gestión Categorías ----------------------------------------------
    private static void menuCategorias() {
        int opcion;
        do {
            System.out.println("\n-------- Gestión Categorías --------");
            System.out.println("1. Alta de categoría");
            System.out.println("2. Modificar categoría");
            System.out.println("3. Baja lógica de categoría");
            System.out.println("4. Listar categorías activas");
            System.out.println("0. Volver al menú principal");
            System.out.println("------------------------------------");
            System.out.print("Opción: ");
            opcion = leerOpcion();

            switch (opcion) {
                case 1 -> altaCategoria();
                case 2 -> modificarCategoria();
                case 3 -> bajaCategoria();
                case 4 -> listarCategorias();
                case 0 -> System.out.println("\nVolviendo al menú principal...");
                default -> System.out.println("\n[!] Opción inválida.");
            }
        } while (opcion != 0);
    }

    static void altaCategoria() {
        System.out.println("\n---- Alta de categoría ----");

        String nombre = pedirTexto("Nombre: ");
        boolean nombreRepetido = categoriaRepo.listarActivos().stream()
                .anyMatch(c -> c.getNombre().equalsIgnoreCase(nombre));
        if (nombreRepetido) {
            System.out.println("\n[!] Error: ya existe una categoría con ese nombre.");
            return;
        }

        System.out.print("Descripción (opcional): ");
        String descripcion = scanner.nextLine().trim();

        Categoria categoriaNueva = categoriaRepo.guardar(Categoria.builder()
                .nombre(nombre)
                .descripcion(descripcion.isEmpty() ? null : descripcion)
                .build());

        if (categoriaNueva == null) {
            System.out.println("\n[!] Error: no se pudo guardar la categoría.");
            return;
        }
        System.out.println("\n-> [+] Categoría guardada con ID: " + categoriaNueva.getId());
    }

    static void modificarCategoria() {
        System.out.println("\n---- Modificar categoría ----");

        if (categoriaRepo.listarActivos().isEmpty()) {
            System.out.println("\n-> No hay categorías activas.");
            return;
        }

        listarCategorias();

        long id = pedirId("\nIngrese ID de la categoría a modificar (0 para cancelar): ");
        if (id == 0) {
            System.out.println("\nOperación cancelada.");
            return;
        }

        Optional<Categoria> opcional = categoriaRepo.buscarPorId(id);
        if (opcional.isEmpty() || opcional.get().isEliminado()) {
            System.out.println("\n[!] No se encontró una categoría activa con ese ID.");
            return;
        }

        Categoria categoria = opcional.get();
        System.out.println("Nombre actual: " + categoria.getNombre());
        System.out.print("Nuevo nombre (Enter para mantener): ");
        String nombre = scanner.nextLine().trim();

        System.out.println("Descripción actual: " + categoria.getDescripcion());
        System.out.print("Nueva descripción (Enter para mantener): ");
        String descripcion = scanner.nextLine().trim();

        if (!nombre.isEmpty()) categoria.setNombre(nombre);
        if (!descripcion.isEmpty()) categoria.setDescripcion(descripcion);

        categoriaRepo.guardar(categoria);
        System.out.println("\n-> [+] Categoría modificada correctamente.");
    }

    static void bajaCategoria() {
        System.out.println("\n---- Baja lógica de categoría ----");

        if (categoriaRepo.listarActivos().isEmpty()) {
            System.out.println("\n-> No hay categorías activas.");
            return;
        }

        listarCategorias();

        long id = pedirId("\nID de la categoría a dar de baja (0 para cancelar): ");
        if (id == 0) {
            System.out.println("\nOperación cancelada.");
            return;
        }

        Optional<Categoria> opcional = categoriaRepo.buscarPorId(id);
        if (opcional.isEmpty() || opcional.get().isEliminado()) {
            System.out.println("\n[!] Error: no se encontró una categoría activa con ese ID.");
            return;
        }

        // Se renombra antes de eliminar para liberar el valor único (UNIQUE constraint en nombre),
        // así pueda crear otra categoría con el mismo nombre en el futuro.
        Categoria categoria = opcional.get();
        String nombreOriginal = categoria.getNombre();
        categoria.setNombre(nombreOriginal + "_eliminado_" + categoria.getId());
        categoriaRepo.guardar(categoria);

        boolean resultado = categoriaRepo.eliminarLogico(id);
        if (resultado) {
            System.out.println("\n-> [+] Categoría '" + nombreOriginal + "' dada de baja correctamente.");
        } else {
            System.out.println("\n[!] Error al dar de baja la categoría.");
        }
    }

    static void listarCategorias() {
        System.out.println("\n---- Categorías activas ----");
        List<Categoria> categorias = categoriaRepo.listarActivos();

        if (categorias.isEmpty()) {
            System.out.println("\n-> No hay categorías activas.");
            return;
        }

        System.out.printf("%-5s %-30s %-45s%n", "ID", "Nombre", "Descripción");
        System.out.println("-".repeat(82));
        for (Categoria c : categorias) {
            System.out.printf("%-5d %-30s %-45s%n",
                    c.getId(),
                    c.getNombre().length() > 25 ? c.getNombre().substring(0, 25) + "..." : c.getNombre(),
                    c.getDescripcion() == null ? "" : c.getDescripcion().length() > 40 ? c.getDescripcion().substring(0, 40) + "..." : c.getDescripcion());
        }
    }



    // ---- 2. Gestión Productos ----------------------------------------------
    static void menuProductos() {
        List<Categoria> categorias = categoriaRepo.listarActivos();

        if (categorias.isEmpty()) {
            System.out.println("\n-> [!] No hay categorías activas. Cree una categoría primero.");
            return;
        }

        int opcion;
        do {
            System.out.println("\n-------- Gestión Productos ---------");
            System.out.println("1. Alta de producto");
            System.out.println("2. Modificar producto");
            System.out.println("3. Baja lógica de producto");
            System.out.println("4. Listar productos activos");
            System.out.println("0. Volver al menú principal");
            System.out.println("------------------------------------");
            System.out.print("Opción: ");
            opcion = leerOpcion();

            switch (opcion) {
                case 1 -> altaProducto();
                case 2 -> modificarProducto();
                case 3 -> bajaProducto();
                case 4 -> listarProductos();
                case 0 -> System.out.println("\nVolviendo al menú principal...");
                default -> System.out.println("\n[!] Opción inválida.");
            }
        } while (opcion != 0);
    }

    static void altaProducto() {
        System.out.println("\n---- Alta producto ----");

        List<Categoria> categorias = categoriaRepo.listarActivos();
        if (categorias.isEmpty()) {
            System.out.println("\n-> No hay categorías activas. Cree una primero.");
            return;
        }

        listarCategorias();

        long categoriaId = pedirId("\nID de categoría (0 para cancelar): ");
        if (categoriaId == 0) {
            System.out.println("\nOperación cancelada.");
            return;
        }

        Optional<Categoria> categoriaOpcional = categoriaRepo.buscarPorId(categoriaId);
        if (categoriaOpcional.isEmpty() || categoriaOpcional.get().isEliminado()) {
            System.out.println("\n[!] Error: categoría no válida o inactiva.");
            return;
        }

        String nombre = pedirTexto("Nombre del producto: ");
        if (productoRepo.listarActivos().stream().anyMatch(p -> p.getNombre().equalsIgnoreCase(nombre))) {
            System.out.println("\n[!] Error: ya existe un producto con ese nombre.");
            return;
        }

        double precio = pedirDouble("Precio: ");

        System.out.print("Descripción (opcional): ");
        String descripcion = scanner.nextLine().trim();

        int stock = pedirInt("Stock: ");

        System.out.print("Imagen (opcional): ");
        String imagenInput = scanner.nextLine().trim();

        System.out.print("Disponible (S/N, default S): ");
        boolean disponible = !scanner.nextLine().trim().equalsIgnoreCase("N");

        Producto producto = Producto.builder()
                .nombre(nombre)
                .precio(precio)
                .descripcion(descripcion.isEmpty() ? null : descripcion)
                .stock(stock)
                .imagen(imagenInput.isEmpty() ? null : imagenInput)
                .disponible(disponible)
                .build();

        EntityManager em = JPAUtil.getEntityManagerFactory().createEntityManager();
        try {
            em.getTransaction().begin();

            Categoria categoriaManaged = em.find(Categoria.class, categoriaId);
            categoriaManaged.addProducto(producto);
            em.persist(producto);

            em.getTransaction().commit();
            System.out.println("\n-> [+] Producto guardado con ID: " + producto.getId() + " | Categoría: " + categoriaManaged.getNombre());
        } catch (Exception e) {
            if (em.getTransaction().isActive()) em.getTransaction().rollback();
            System.out.println("\n[!] Error al persistir el producto: " + e.getMessage());
        } finally {
            em.close();
        }
    }

    static void modificarProducto() {
        System.out.println("\n---- Modificar producto ----");

        List<Object[]> filas = productoRepo.listarActivosConCategoria();
        if (filas.isEmpty()) {
            System.out.println("\n-> No hay productos activos.");
            return;
        }

        listarProductos();

        long id = pedirId("\nID del producto a modificar (0 para cancelar): ");
        if (id == 0) {
            System.out.println("\nOperación cancelada.");
            return;
        }

        Optional<Producto> opcional = productoRepo.buscarPorId(id);
        if (opcional.isEmpty() || opcional.get().isEliminado()) {
            System.out.println("\n[!] Error: no se encontró un producto activo con ese ID.");
            return;
        }

        Producto producto = opcional.get();

        System.out.println("Nombre actual: " + producto.getNombre());
        System.out.print("Nuevo nombre (Enter para mantener): ");
        String nombre = scanner.nextLine().trim();

        System.out.println("Descripción actual: " + producto.getDescripcion());
        System.out.print("Nueva descripción (Enter para mantener): ");
        String descripcion = scanner.nextLine().trim();

        System.out.println("Precio actual: " + producto.getPrecio());
        System.out.print("Nuevo precio (Enter para mantener): ");
        String precioStr = scanner.nextLine().trim();

        System.out.println("Stock actual: " + producto.getStock());
        System.out.print("Nuevo stock (Enter para mantener): ");
        String stockStr = scanner.nextLine().trim();

        System.out.println("Imagen actual: " + producto.getImagen());
        System.out.print("Nueva imagen (Enter para mantener): ");
        String imagen = scanner.nextLine().trim();

        System.out.println("Disponible actualmente: " + (Boolean.TRUE.equals(producto.getDisponible()) ? "Sí" : "No"));
        System.out.print("¿Disponible? (S/N, Enter para mantener): ");
        String disponibleInput = scanner.nextLine().trim();

        if (!nombre.isEmpty()) producto.setNombre(nombre);
        if (!descripcion.isEmpty()) producto.setDescripcion(descripcion);
        if (!imagen.isEmpty()) producto.setImagen(imagen);
        if (!disponibleInput.isEmpty()) {
            producto.setDisponible(disponibleInput.equalsIgnoreCase("S"));
        }

        if (!precioStr.isEmpty()) {
            try {
                double precio = Double.parseDouble(precioStr);
                if (precio <= 0) {
                    System.out.println("\n[!] Error: el precio debe ser mayor a 0.");
                    return;
                }
                producto.setPrecio(precio);
            } catch (NumberFormatException e) {
                System.out.println("\n[!] Error: precio inválido.");
                return;
            }
        }

        if (!stockStr.isEmpty()) {
            try {
                int stock = Integer.parseInt(stockStr);
                if (stock < 0) {
                    System.out.println("\n[!] Error: el stock no puede ser negativo.");
                    return;
                }
                producto.setStock(stock);
            } catch (NumberFormatException e) {
                System.out.println("\n[!] Error: stock inválido.");
                return;
            }
        }

        productoRepo.guardar(producto);
        System.out.println("\n-> [+] Producto modificado correctamente.");
    }

    static void bajaProducto() {
        System.out.println("\n---- Baja producto ----");

        if (productoRepo.listarActivosConCategoria().isEmpty()) {
            System.out.println("\n-> No hay productos activos.");
            return;
        }

        listarProductos();

        long id = pedirId("\nID del producto a dar de baja (0 para cancelar): ");
        if (id == 0) {
            System.out.println("\nOperación cancelada.");
            return;
        }

        Optional<Producto> opcional = productoRepo.buscarPorId(id);
        if (opcional.isEmpty() || opcional.get().isEliminado()) {
            System.out.println("\n[!] Error: no se encontró un producto activo con ese ID.");
            return;
        }

        // Se renombra antes de eliminar para liberar el valor único (UNIQUE constraint en nombre),
        // así pueda crear otro producto con el mismo nombre en el futuro.
        Producto producto = opcional.get();
        String nombreOriginal = producto.getNombre();
        producto.setNombre(nombreOriginal + "_eliminado_" + producto.getId());
        productoRepo.guardar(producto);

        boolean resultado = productoRepo.eliminarLogico(id);
        if (resultado) {
            System.out.println("\n-> [+] Producto '" + nombreOriginal + "' dado de baja correctamente.");
        } else {
            System.out.println("\n-> [!] Error al dar de baja el producto.");
        }
    }

    static void listarProductos() {
        System.out.println("\n---- Productos activos ----");
        List<Object[]> filas = productoRepo.listarActivosConCategoria();

        if (filas.isEmpty()) {
            System.out.println("\n-> No hay productos activos.");
            return;
        }

        System.out.printf("%-5s %-30s %-37s %-10s %-8s %-12s %-25s%n",
                "ID", "Nombre", "Descripción", "Precio", "Stock", "Disponible", "Categoría");
        System.out.println("-".repeat(135));
        for (Object[] fila : filas) {
            Producto p = (Producto) fila[0];
            String catNombre = (String) fila[1];
            System.out.printf("%-5d %-30s %-37s %-10.2f %-8d %-12s %-25s%n",
                    p.getId(),
                    p.getNombre().length() > 25 ? p.getNombre().substring(0, 25) + "..." : p.getNombre(),
                    p.getDescripcion() == null ? "" : p.getDescripcion().length() > 32 ? p.getDescripcion().substring(0, 32) + "..." : p.getDescripcion(),
                    p.getPrecio(), p.getStock(),
                    Boolean.TRUE.equals(p.getDisponible()) ? "Sí" : "No",
                    catNombre);
        }
    }



    // ---- 3. Gestión Usuarios ----------------------------------------------
    static void menuUsuarios() {
        int opcion;
        do {
            System.out.println("\n--------- Gestión Usuarios ---------");
            System.out.println("1. Alta de usuario");
            System.out.println("2. Modificar usuario");
            System.out.println("3. Baja lógica de usuario");
            System.out.println("4. Listar usuarios activos");
            System.out.println("5. Buscar por mail");
            System.out.println("0. Volver al menú principal");
            System.out.println("------------------------------------");
            System.out.print("Opción: ");
            opcion = leerOpcion();

            switch (opcion) {
                case 1 -> altaUsuario();
                case 2 -> modificarUsuario();
                case 3 -> bajaUsuario();
                case 4 -> listarUsuarios();
                case 5 -> buscarUsuarioPorMail();
                case 0 -> System.out.println("\nVolviendo al menú principal...");
                default -> System.out.println("\n[!] Opción inválida.");
            }
        } while (opcion != 0);
    }

    static void altaUsuario() {
        System.out.println("\n---- Alta de usuario ----");

        String nombre = pedirTexto("Nombre: ");
        String apellido = pedirTexto("Apellido: ");
        String mail = pedirTexto("Mail: ");

        if (usuarioRepo.buscarPorMail(mail).isPresent()) {
            System.out.println("\n[!] Ya existe un usuario activo con ese mail.");
            return;
        }

        System.out.print("Celular (opcional): ");
        String celular = scanner.nextLine().trim();

        String contrasena = pedirTexto("Contraseña: ");

        Rol rol = pedirRol();

        Usuario usuarioNuevo = usuarioRepo.guardar(Usuario.builder()
                .nombre(nombre)
                .apellido(apellido)
                .mail(mail)
                .celular(celular.isEmpty() ? null : celular)
                .contrasena(contrasena)
                .rol(rol)
                .build());

        System.out.println("\n-> [+] Usuario guardado con ID: " + usuarioNuevo.getId());
    }

    static void modificarUsuario() {
        System.out.println("\n---- Modificar usuario ----");

        if (usuarioRepo.listarActivos().isEmpty()) {
            System.out.println("\n-> No hay usuarios activos.");
            return;
        }

        listarUsuarios();

        long id = pedirId("\nID del usuario a modificar (0 para cancelar): ");
        if (id == 0) {
            System.out.println("\nOperación cancelada.");
            return; }

        Optional<Usuario> opcional = usuarioRepo.buscarPorId(id);
        if (opcional.isEmpty() || opcional.get().isEliminado()) {
            System.out.println("\n[!] No se encontró un usuario activo con ese ID.");
            return;
        }

        Usuario usuario = opcional.get();

        System.out.println("Nombre actual: " + usuario.getNombre());
        System.out.print("Nuevo nombre (Enter para mantener): ");
        String nombre = scanner.nextLine().trim();

        System.out.println("Apellido actual: " + usuario.getApellido());
        System.out.print("Nuevo apellido (Enter para mantener): ");
        String apellido = scanner.nextLine().trim();

        System.out.println("Mail actual: " + usuario.getMail());
        System.out.print("Nuevo mail (Enter para mantener): ");
        String mail = scanner.nextLine().trim();

        System.out.println("Celular actual: " + usuario.getCelular());
        System.out.print("Nuevo celular (Enter para mantener): ");
        String celular = scanner.nextLine().trim();

        System.out.println("Contraseña actual: [oculta]");
        System.out.print("Nueva contraseña (Enter para mantener): ");
        String contrasena = scanner.nextLine().trim();

        if (!nombre.isEmpty()) usuario.setNombre(nombre);
        if (!apellido.isEmpty()) usuario.setApellido(apellido);
        if (!celular.isEmpty()) usuario.setCelular(celular);
        if (!contrasena.isEmpty()) usuario.setContrasena(contrasena);

        if (!mail.isEmpty()) {
            Optional<Usuario> existente = usuarioRepo.buscarPorMail(mail);
            if (existente.isPresent() && !existente.get().getId().equals(usuario.getId())) {
                System.out.println("\n[!] Ese mail ya está en uso por otro usuario.");
                return;
            }
            usuario.setMail(mail);
        }

        usuarioRepo.guardar(usuario);
        System.out.println("\n-> [+] Usuario modificado correctamente.");
    }

    static void bajaUsuario() {
        System.out.println("\n---- Baja lógica de usuario ----");

        if (usuarioRepo.listarActivos().isEmpty()) {
            System.out.println("\n-> No hay usuarios activos.");
            return;
        }

        listarUsuarios();

        long id = pedirId("\nID del usuario a dar de baja (0 para cancelar): ");
        if (id == 0) {
            System.out.println("\nOperación cancelada.");
            return;
        }

        Optional<Usuario> opcional = usuarioRepo.buscarPorId(id);
        if (opcional.isEmpty() || opcional.get().isEliminado()) {
            System.out.println("\n[!] No se encontró un usuario activo con ese ID.");
            return;
        }

        Usuario usuario = opcional.get();
        String nombreCompleto = usuario.getNombre() + " " + usuario.getApellido();

        boolean resultado = usuarioRepo.eliminarLogico(id);
        if (resultado) {
            System.out.println("\n-> [+] Usuario '" + nombreCompleto + "' dado de baja correctamente.");
            System.out.println("   Sus pedidos permanecen en el sistema.");
        } else {
            System.out.println("\n-> [!] Error al dar de baja el usuario.");
        }
    }

    static void listarUsuarios() {
        System.out.println("\n---- Usuarios activos ----");
        List<Usuario> usuarios = usuarioRepo.listarActivos();

        if (usuarios.isEmpty()) {
            System.out.println("\n-> No hay usuarios activos.");
            return;
        }

        System.out.printf("%-5s %-35s %-33s %-10s%n", "ID", "Nombre completo", "Mail", "Rol");
        System.out.println("-".repeat(88));
        for (Usuario u : usuarios) {
            String nombreCompleto = u.getNombre() + " " + u.getApellido();
            System.out.printf("%-5d %-35s %-33s %-10s%n",
                    u.getId(),
                    nombreCompleto.length() > 30 ? nombreCompleto.substring(0, 30) + "..." : nombreCompleto,
                    u.getMail().length() > 28 ? u.getMail().substring(0, 28) + "..." : u.getMail(),
                    u.getRol());
        }
    }

    static void buscarUsuarioPorMail() {
        System.out.println("\n---- Buscar usuario por mail ----");
        System.out.print("Mail: ");
        String mail = scanner.nextLine().trim();

        Optional<Usuario> opcional = usuarioRepo.buscarPorMail(mail);
        if (opcional.isEmpty()) {
            System.out.println("\n-> No existe un usuario activo con ese mail.");
            return;
        }

        Usuario u = opcional.get();
        System.out.println("\n---- Datos del usuario -----------------");
        System.out.println("- ID:       " + u.getId());
        System.out.println("- Nombre:   " + u.getNombre() + " " + u.getApellido());
        System.out.println("- Mail:     " + u.getMail());
        System.out.println("- Celular:  " + (u.getCelular() != null ? u.getCelular() : "-"));
        System.out.println("- Rol:      " + u.getRol());
    }



    // ---- 4. Gestión Pedidos ----------------------------------------------
    static void menuPedidos() {
        int opcion;
        do {
            System.out.println("\n--------- Gestión Pedidos ----------");
            System.out.println("1. Alta de pedido");
            System.out.println("2. Cambiar estado de pedido");
            System.out.println("3. Baja lógica de pedido");
            System.out.println("4. Listar pedidos activos");
            System.out.println("5. Pedidos por usuario");
            System.out.println("6. Pedidos por estado");
            System.out.println("0. Volver al menú principal");
            System.out.println("------------------------------------");
            System.out.print("Opción: ");
            opcion = leerOpcion();

            switch (opcion) {
                case 1 -> altaPedido();
                case 2 -> cambiarEstadoPedido();
                case 3 -> bajaPedido();
                case 4 -> listarPedidos();
                case 5 -> pedidosPorUsuario();
                case 6 -> pedidosPorEstado();
                case 0 -> System.out.println("\nVolviendo al menú principal...");
                default -> System.out.println("\n[!] Opción inválida.");
            }
        } while (opcion != 0);
    }

    static void altaPedido() {
        System.out.println("\n---- Alta de pedido ----");

        // 1. Seleccionar usuario
        List<Usuario> usuarios = usuarioRepo.listarActivos();
        if (usuarios.isEmpty()) {
            System.out.println("\n-> No hay usuarios activos. Cree uno primero.");
            return;
        }

        listarUsuarios();
        long usuarioId = pedirId("\nID del usuario (0 para cancelar): ");
        if (usuarioId == 0) {
            System.out.println("\nOperación cancelada.");
            return;
        }

        Optional<Usuario> usuarioOpc = usuarioRepo.buscarPorId(usuarioId);
        if (usuarioOpc.isEmpty() || usuarioOpc.get().isEliminado()) {
            System.out.println("\n[!] Usuario no válido.");
            return;
        }

        // 2. Seleccionar forma de pago
        FormaPago formaPago = pedirFormaPago();

        // 3. Armar lista temporal de (idProducto, cantidad) sin abrir transacción todavía
        Map<Long, Integer> itemsTemp = new LinkedHashMap<>();
        boolean agregarMas = true;

        while (agregarMas) {
            List<Object[]> productosDisponibles = productoRepo.listarActivosConCategoria().stream()
                    .filter(f -> {
                        Producto p = (Producto) f[0];
                        return Boolean.TRUE.equals(p.getDisponible()) && p.getStock() > 0;
                    }).toList();

            if (productosDisponibles.isEmpty()) {
                System.out.println("\n-> No hay productos disponibles con stock.");
                break;
            }

            System.out.println("\n---- Productos disponibles ----");
            System.out.printf("%-5s %-30s %-10s %-8s%n", "ID", "Nombre", "Precio", "Stock");
            System.out.println("-".repeat(60));
            for (Object[] fila : productosDisponibles) {
                Producto p = (Producto) fila[0];
                String nombre = p.getNombre();
                System.out.printf("%-5d %-30s %-10.2f %-8d%n",
                        p.getId(),
                        nombre.length() > 25 ? nombre.substring(0, 25) + "..." : nombre,
                        p.getPrecio(), p.getStock());
            }

            long prodId = pedirId("\nID del producto a agregar (0 para terminar): ");
            if (prodId == 0) break;

            Optional<Producto> prodOpc = productoRepo.buscarPorId(prodId);
            if (prodOpc.isEmpty() || prodOpc.get().isEliminado()) {
                System.out.println("\n[!] Producto no encontrado.");
                continue;
            }

            Producto prod = prodOpc.get();
            if (!Boolean.TRUE.equals(prod.getDisponible())) {
                System.out.println("\n[!] El producto no está disponible.");
                continue;
            }

            // Stock considerando lo ya reservado en la lista temporal
            int yaReservado = itemsTemp.getOrDefault(prodId, 0);
            int stockDisponible = prod.getStock() - yaReservado;

            if (stockDisponible <= 0) {
                System.out.println("\n[!] Stock insuficiente. Stock disponible: " + prod.getStock());
                continue;
            }

            System.out.print("Cantidad (stock disponible: " + stockDisponible + "): ");
            int cantidad;
            try {
                cantidad = Integer.parseInt(scanner.nextLine().trim());
                if (cantidad <= 0) { System.out.println("\n[!] La cantidad debe ser mayor a 0."); continue; }
                if (cantidad > stockDisponible) {
                    System.out.println("\n[!] Cantidad supera el stock disponible (" + stockDisponible + ").");
                    continue;
                }
            } catch (NumberFormatException e) {
                System.out.println("\n[!] Cantidad inválida.");
                continue;
            }

            itemsTemp.merge(prodId, cantidad, Integer::sum);
            System.out.println("-> Agregado: " + prod.getNombre() + " x" + cantidad);

            System.out.print("¿Agregar otro producto? (S/N): ");
            agregarMas = scanner.nextLine().trim().equalsIgnoreCase("S");
        }

        if (itemsTemp.isEmpty()) {
            System.out.println("\n[!] El pedido debe tener al menos un detalle. Operación cancelada.");
            return;
        }

        // 4. Persistir en una única transacción atómica
        EntityManager em = JPAUtil.getEntityManagerFactory().createEntityManager();
        try {
            em.getTransaction().begin();

            Usuario usuarioManaged = em.find(Usuario.class, usuarioId);

            Pedido pedido = Pedido.builder()
                    .fecha(LocalDate.now())
                    .estado(Estado.PENDIENTE)
                    .formaPago(formaPago)
                    .total(0.0)
                    .build();

            for (Map.Entry<Long, Integer> entry : itemsTemp.entrySet()) {
                Producto prodManaged = em.find(Producto.class, entry.getKey());
                int cantidad = entry.getValue();

                pedido.addDetallePedido(cantidad, prodManaged);
                prodManaged.setStock(prodManaged.getStock() - cantidad);
            }

            pedido.calcularTotal();
            em.persist(pedido);
            usuarioManaged.addPedido(pedido);

            em.getTransaction().commit();

            // Mostrar resumen del pedido creado
            System.out.println("\n==== Pedido creado =======================================");
            System.out.println("- ID:          " + pedido.getId());
            System.out.println("- Fecha:       " + pedido.getFecha());
            System.out.println("- Usuario:     " + usuarioManaged.getNombre() + " " + usuarioManaged.getApellido());
            System.out.println("- Forma pago:  " + pedido.getFormaPago());
            System.out.println("- Estado:      " + pedido.getEstado());
            System.out.println("\n---- Detalle: ----");
            System.out.printf("  %-30s %-8s %-15s%n", "Producto", "Cant.", "Subtotal");
            for (DetallePedido d : pedido.getDetalles()) {
                String nombreProd = d.getProducto().getNombre();
                System.out.printf("  - %-28s %-8d $%-15.2f%n",
                        nombreProd.length() > 23 ? nombreProd.substring(0, 23) + "..." : nombreProd,
                        d.getCantidad(), d.getSubtotal());
            }
            System.out.printf("%nTotal: $%.2f%n", pedido.getTotal());
            System.out.println("==========================================================");

        } catch (Exception e) {
            if (em.getTransaction().isActive()) em.getTransaction().rollback();
            System.out.println("\n[!] Error al crear el pedido: " + e.getMessage());
        } finally {
            em.close();
        }
    }

    static void cambiarEstadoPedido() {
        System.out.println("\n---- Cambiar estado de pedido ----");

        List<Pedido> pedidos = pedidoRepo.listarActivos();
        if (pedidos.isEmpty()) {
            System.out.println("\n-> No hay pedidos activos.");
            return;
        }

        listarPedidos();

        long id = pedirId("\nID del pedido (0 para cancelar): ");
        if (id == 0) {
            System.out.println("\nOperación cancelada.");
            return;
        }

        Optional<Pedido> opcional = pedidoRepo.buscarPorId(id);
        if (opcional.isEmpty() || opcional.get().isEliminado()) {
            System.out.println("\n[!] No se encontró un pedido activo con ese ID.");
            return;
        }

        Pedido pedido = opcional.get();
        System.out.println("Estado actual: " + pedido.getEstado());

        Estado nuevoEstado = pedirEstado();
        pedido.setEstado(nuevoEstado);
        pedidoRepo.guardar(pedido);

        System.out.println("\n-> Pedido con ID " + pedido.getId() + " actualizado a: " + nuevoEstado);
    }

    static void bajaPedido() {
        System.out.println("\n---- Baja lógica de pedido ----");

        if (pedidoRepo.listarActivos().isEmpty()) {
            System.out.println("\n-> No hay pedidos activos.");
            return;
        }

        listarPedidos();

        long id = pedirId("\nID del pedido a dar de baja (0 para cancelar): ");
        if (id == 0) {
            System.out.println("\nOperación cancelada.");
            return;
        }

        Optional<Pedido> opcional = pedidoRepo.buscarPorId(id);
        if (opcional.isEmpty() || opcional.get().isEliminado()) {
            System.out.println("\n[!] No se encontró un pedido activo con ese ID.");
            return;
        }

        Pedido pedido = opcional.get();
        pedidoRepo.eliminarLogico(id);
        System.out.printf("%n-> Pedido con ID %d dado de baja. Total: $%.2f%n",
                pedido.getId(), pedido.getTotal());
        System.out.println("   El stock de los productos NO fue restaurado.");
    }

    static void listarPedidos() {
        System.out.println("\n---- Pedidos activos ----");
        List<Pedido> pedidos = pedidoRepo.listarActivos();

        if (pedidos.isEmpty()) {
            System.out.println("\n-> No hay pedidos activos.");
            return;
        }

        // Mapa auxiliar para mostrar el usuario de cada pedido
        Map<Long, String> pedidoUsuario = construirMapaPedidoUsuario();

        System.out.printf("%-5s %-12s %-12s %-15s %-35s %-15s%n",
                "ID", "Fecha", "Estado", "FormaPago", "Usuario", "Total");
        System.out.println("-".repeat(100));
        for (Pedido p : pedidos) {
            String nombreUsuario = pedidoUsuario.getOrDefault(p.getId(), "-");
            System.out.printf("%-5d %-12s %-12s %-15s %-35s $%-15.2f%n",
                    p.getId(), p.getFecha(), p.getEstado(), p.getFormaPago(),
                    nombreUsuario.length() > 30 ? nombreUsuario.substring(0, 30) + "..." : nombreUsuario,
                    p.getTotal());
        }
    }

    static void pedidosPorUsuario() {
        System.out.println("\n---- Pedidos por usuario ----");

        if (usuarioRepo.listarActivos().isEmpty()) {
            System.out.println("\n-> No hay usuarios activos.");
            return;
        }

        listarUsuarios();
        long usuarioId = pedirId("\nID del usuario (0 para cancelar): ");
        if (usuarioId == 0) {
            System.out.println("\nOperación cancelada.");
            return;
        }

        Optional<Usuario> usuarioOpc = usuarioRepo.buscarPorId(usuarioId);
        if (usuarioOpc.isEmpty() || usuarioOpc.get().isEliminado()) {
            System.out.println("\n[!] No se encontró un usuario activo con ese ID.");
            return;
        }

        List<Pedido> pedidos = usuarioRepo.buscarPedidosPorUsuario(usuarioId);
        if (pedidos.isEmpty()) {
            System.out.println("\n-> El usuario no tiene pedidos activos.");
            return;
        }

        Usuario u = usuarioOpc.get();
        System.out.println("\n---- Pedidos de '" + u.getNombre() + " " + u.getApellido() + "':");
        System.out.printf("%-5s %-12s %-12s %-15s %-15s%n",
                "ID", "Fecha", "Estado", "FormaPago", "Total");
        System.out.println("-".repeat(64));
        for (Pedido p : pedidos) {
            System.out.printf("%-5d %-12s %-12s %-15s $%-15.2f%n",
                    p.getId(), p.getFecha(), p.getEstado(), p.getFormaPago(), p.getTotal());
        }
    }

    static void pedidosPorEstado() {
        System.out.println("\n---- Pedidos por estado ----");
        Estado estado = pedirEstado();

        List<Pedido> pedidos = pedidoRepo.buscarPorEstado(estado);
        if (pedidos.isEmpty()) {
            System.out.println("\n-> No hay pedidos activos con estado " + estado + ".");
            return;
        }

        Map<Long, String> pedidoUsuario = construirMapaPedidoUsuario();

        System.out.println("\n---- Pedidos con estado '" + estado + "':");
        System.out.printf("%-5s %-12s %-35s %-15s%n", "ID", "Fecha", "Usuario", "Total");
        System.out.println("-".repeat(71));
        for (Pedido p : pedidos) {
            String nombreUsuario = pedidoUsuario.getOrDefault(p.getId(), "-");
            System.out.printf("%-5d %-12s %-35s $%-15.2f%n",
                    p.getId(), p.getFecha(),
                    nombreUsuario.length() > 30 ? nombreUsuario.substring(0, 30) + "..." : nombreUsuario,
                    p.getTotal());
        }
    }

    /**
     * Construye un mapa de idPedido -> "Nombre Apellido" navegando desde
     * cada usuario activo hacia sus pedidos, ya que la relación es unidireccional
     * y Pedido no conoce a su Usuario.
     */
    static Map<Long, String> construirMapaPedidoUsuario() {
        Map<Long, String> mapa = new HashMap<>();
        for (Usuario u : usuarioRepo.listarActivos()) {
            List<Pedido> pedidosDeUsuario = usuarioRepo.buscarPedidosPorUsuario(u.getId());
            String nombreCompleto = u.getNombre() + " " + u.getApellido();
            for (Pedido p : pedidosDeUsuario) {
                mapa.put(p.getId(), nombreCompleto);
            }
        }
        return mapa;
    }



    // ---- 5. Reportes ----------------------------------------------
    static void menuReportes() {
        int opcion;
        do {
            System.out.println("\n------------- Reportes -------------");
            System.out.println("1. Productos por categoría");
            System.out.println("2. Pedidos por usuario");
            System.out.println("3. Pedidos por estado");
            System.out.println("4. Total facturado");
            System.out.println("0. Volver al menú principal");
            System.out.println("------------------------------------");
            System.out.print("Opción: ");
            opcion = leerOpcion();

            switch (opcion) {
                case 1 -> reporteProductosPorCategoria();
                case 2 -> reportePedidosPorUsuario();
                case 3 -> reportePedidosPorEstado();
                case 4 -> reporteTotalFacturado();
                case 0 -> System.out.println("\nVolviendo...");
                default -> System.out.println("\n[!] Opción inválida.");
            }
        } while (opcion != 0);
    }

    static void reporteProductosPorCategoria() {
        System.out.println("\n---- Reporte: Productos por categoría ----");

        if (categoriaRepo.listarActivos().isEmpty()) {
            System.out.println("\n-> No hay categorías activas.");
            return;
        }

        listarCategorias();
        long categoriaId = pedirId("\nID de categoría (0 para cancelar): ");
        if (categoriaId == 0) {
            System.out.println("\nOperación cancelada.");
            return;
        }

        Optional<Categoria> catOpc = categoriaRepo.buscarPorId(categoriaId);
        if (catOpc.isEmpty() || catOpc.get().isEliminado()) {
            System.out.println("\n[!] Categoría no válida.");
            return;
        }

        List<Producto> productos = categoriaRepo.buscarProductosPorCategoria(categoriaId);
        if (productos.isEmpty()) {
            System.out.println("\n-> La categoría '" + catOpc.get().getNombre() + "' no tiene productos activos.");
            return;
        }

        System.out.println("\nProductos activos en '" + catOpc.get().getNombre() + "':");
        System.out.printf("%-5s %-30s %-10s %-8s%n", "ID", "Nombre", "Precio", "Stock");
        System.out.println("-".repeat(60));
        for (Producto p : productos) {
            String nombre = p.getNombre();
            System.out.printf("%-5d %-30s %-10.2f %-8d%n",
                    p.getId(),
                    nombre.length() > 25 ? nombre.substring(0, 25) + "..." : nombre,
                    p.getPrecio(), p.getStock());
        }
    }

    static void reportePedidosPorUsuario() {
        System.out.println("\n---- Reporte: Pedidos por usuario ----");

        if (usuarioRepo.listarActivos().isEmpty()) {
            System.out.println("\n-> No hay usuarios activos.");
            return;
        }

        listarUsuarios();
        long usuarioId = pedirId("\nID del usuario (0 para cancelar): ");
        if (usuarioId == 0) {
            System.out.println("\nOperación cancelada.");
            return;
        }

        Optional<Usuario> usuarioOpc = usuarioRepo.buscarPorId(usuarioId);
        if (usuarioOpc.isEmpty() || usuarioOpc.get().isEliminado()) {
            System.out.println("\n[!] No se encontró un usuario activo con ese ID.");
            return;
        }

        List<Pedido> pedidos = usuarioRepo.buscarPedidosPorUsuario(usuarioId);
        if (pedidos.isEmpty()) {
            System.out.println("\n-> El usuario no tiene pedidos activos.");
            return;
        }

        Usuario u = usuarioOpc.get();
        System.out.println("\nPedidos de " + u.getNombre() + " " + u.getApellido() + ":");
        System.out.printf("%-5s %-12s %-12s %-15s %-15s%n",
                "ID", "Fecha", "Estado", "FormaPago", "Total");
        System.out.println("-".repeat(64));
        for (Pedido p : pedidos) {
            System.out.printf("%-5d %-12s %-12s %-15s $%-15.2f%n",
                    p.getId(), p.getFecha(), p.getEstado(), p.getFormaPago(), p.getTotal());
        }
    }

    static void reportePedidosPorEstado() {
        System.out.println("\n---- Reporte: Pedidos por estado ----");
        Estado estado = pedirEstado();

        List<Pedido> pedidos = pedidoRepo.buscarPorEstado(estado);
        if (pedidos.isEmpty()) {
            System.out.println("\n-> No hay pedidos activos con estado " + estado + ".");
            return;
        }

        Map<Long, String> pedidoUsuario = construirMapaPedidoUsuario();

        System.out.println("\nPedidos con estado " + estado + ":");
        System.out.printf("%-5s %-12s %-35s %-15s%n", "ID", "Fecha", "Usuario", "Total");
        System.out.println("-".repeat(71));
        for (Pedido p : pedidos) {
            String nombreUsuario = pedidoUsuario.getOrDefault(p.getId(), "-");
            System.out.printf("%-5d %-12s %-35s $%-15.2f%n",
                    p.getId(), p.getFecha(),
                    nombreUsuario.length() > 30 ? nombreUsuario.substring(0, 30) + "..." : nombreUsuario,
                    p.getTotal());
        }
    }

    static void reporteTotalFacturado() {
        System.out.println("\n---- Reporte: Total facturado ----");

        List<Pedido> terminados = pedidoRepo.buscarPorEstado(Estado.TERMINADO);
        double total = terminados.stream()
                .mapToDouble(p -> p.getTotal() != null ? p.getTotal() : 0.0)
                .sum();

        System.out.printf("Total facturado (pedidos TERMINADOS): %s%n",
                String.format(Locale.US, "$%.2f", total));
    }



    // ---- Funciones auxiliares ----------------------------------------------
    static int leerOpcion() {
        try {
            return Integer.parseInt(scanner.nextLine().trim());
        } catch (NumberFormatException e) {
            return -1;
        }
    }

    static long leerLong() {
        try {
            return Long.parseLong(scanner.nextLine().trim());
        } catch (NumberFormatException e) {
            return -1L;
        }
    }

    static long pedirId(String mensaje) {
        while (true) {
            System.out.print(mensaje);
            long id = leerLong();
            if (id == 0) return 0;
            if (id > 0) return id;
            System.out.println("\n[!] ID inválido. Ingrese un número válido positivo o 0 para cancelar.");
        }
    }

    static String pedirTexto(String mensaje) {
        while (true) {
            System.out.print(mensaje);
            String input = scanner.nextLine().trim();
            if (!input.isEmpty()) return input;
            System.out.println("\n[!] El campo no puede estar vacío.");
        }
    }

    static double pedirDouble(String mensaje) {
        while (true) {
            System.out.print(mensaje);
            try {
                double valor = Double.parseDouble(scanner.nextLine().trim());
                if (valor > 0) return valor;
                System.out.println("\n[!] Debe ser mayor a 0.");
            } catch (NumberFormatException e) {
                System.out.println("\n[!] Valor inválido. Ingrese un número.");
            }
        }
    }

    static int pedirInt(String mensaje) {
        while (true) {
            System.out.print(mensaje);
            try {
                int valor = Integer.parseInt(scanner.nextLine().trim());
                if (valor >= 0) return valor;
                System.out.println("\n[!] No puede ser negativo.");
            } catch (NumberFormatException e) {
                System.out.println("\n[!] Valor inválido. Ingrese un número entero.");
            }
        }
    }

    static Rol pedirRol() {
        while (true) {
            System.out.println("Rol: 1. ADMIN   2. USUARIO");
            System.out.print("Opción: ");
            int op = leerOpcion();
            if (op == 1) return Rol.ADMIN;
            if (op == 2) return Rol.USUARIO;
            System.out.println("\n[!] Opción inválida.");
        }
    }

    static FormaPago pedirFormaPago() {
        while (true) {
            System.out.println("Forma de pago: 1. TARJETA   2. TRANSFERENCIA   3. EFECTIVO");
            System.out.print("Opción: ");
            int op = leerOpcion();
            switch (op) {
                case 1 -> { return FormaPago.TARJETA; }
                case 2 -> { return FormaPago.TRANSFERENCIA; }
                case 3 -> { return FormaPago.EFECTIVO; }
                default -> System.out.println("\n[!] Opción inválida.");
            }
        }
    }

    static Estado pedirEstado() {
        while (true) {
            System.out.println("Estado: 1. PENDIENTE   2. CONFIRMADO   3. TERMINADO   4. CANCELADO");
            System.out.print("Opción: ");
            int op = leerOpcion();
            switch (op) {
                case 1 -> { return Estado.PENDIENTE; }
                case 2 -> { return Estado.CONFIRMADO; }
                case 3 -> { return Estado.TERMINADO; }
                case 4 -> { return Estado.CANCELADO; }
                default -> System.out.println("\n[!] Opción inválida.");
            }
        }
    }

}
