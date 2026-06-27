package com.tp.jpa.repository;

import com.tp.jpa.model.Producto;
import jakarta.persistence.EntityManager;

import java.util.List;

/**
 * Repositorio de Producto. Hereda todo el CRUD de BaseRepository; no
 * requiere queries adicionales.
 *
 * Nota de diseño: la búsqueda de productos por categoría NO vive aquí porque
 * la relación Categoria–Producto es unidireccional y la dueña es Categoria
 * (es Categoria quien posee el Set<Producto>). Producto no conoce su
 * categoría, por lo que esa consulta se ubica en CategoriaRepository.
 */
public class ProductoRepository extends BaseRepository<Producto> {

    public ProductoRepository() {
        super(Producto.class);
    }

    /**
     * Retorna los productos activos junto con el nombre de su categoría.
     * Consulta JPQL: navega desde Categoria hacia su colección de productos
     * para poder obtener el nombre de la categoría asociada a cada producto.
     * Retorna Object[] donde [0] = Producto y [1] = nombre de la categoría (String).
     */
    public List<Object[]> listarActivosConCategoria() {
        EntityManager em = emf.createEntityManager();
        try {
            // Consulta JPQL: retorna cada producto activo junto con el nombre
            // de su categoría. Como Categoria es la dueña de la relación
            // unidireccional, se navega desde c.productos mediante JOIN.
            // Se filtra por p.eliminado = false para excluir las bajas lógicas.
            String jpql = "SELECT p, c.nombre FROM Categoria c JOIN c.productos p " +
                    "WHERE p.eliminado = false";
            return em.createQuery(jpql, Object[].class).getResultList();
        } finally {
            em.close();
        }
    }

}
