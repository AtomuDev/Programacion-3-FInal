// A. Renderizar Categorías
const listaCategorias = document.getElementById("lista-categorias");

const cargarCategorias = () => {
    categorias.forEach((categoria) => {
        const li = document.createElement("li")
        li.innerHTML = `<a href="#">${categoria}</a>`
        listaCategorias.appendChild(li)
    });
};

cargarCategorias();


// B. Renderizar Productos
const listaProductos = document.getElementById("contenedor-productos");

const cargarProductos = () => {
    productos.forEach((producto) => {
        const article = document.createElement("article")
        article.classList.add("product-card")
        article.innerHTML = `
            <img src="${producto.imagen}" alt="${producto.nombre}" loading="lazy" width="400">
            <div class="product-card__info">
                <h3>${producto.nombre}</h3>
                <p class="product-card__descripcion">${producto.descripcion}</p>
            </div>
            <p class="product-card__precio">$${producto.precio}</p>
            <footer class="product-card__actions">
                <button type="button">Ver Detalles</button>
                <button type="button" onclick="alert('Agregaste: ${producto.nombre}')">Agregar al Carrito</button>
            </footer>`
        listaProductos.appendChild(article)
    });
};

cargarProductos();
