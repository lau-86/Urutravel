const contenedorProductos = document.querySelector(".products");

async function cargarProductos() {
  try {
    const respuesta = await fetch("../data/productos.json");
    const productos = await respuesta.json();
    mostrarProductos(productos);
  } catch (error) {
    console.error("Error al cargar los productos:", error);
  }
}

function mostrarProductos(productos) {
  contenedorProductos.innerHTML = "";

  productos.forEach((producto) => {
    const elementoProducto = document.createElement("div");
    elementoProducto.classList.add("product");
    elementoProducto.id = producto.id;
    elementoProducto.innerHTML = `
            <div class="carousel">
                <div class="carouselimages">
                    ${producto.images
                      .map(
                        (imagen) =>
                          `<img src="${imagen}" alt="${
                            producto.title || producto.name
                          }">`
                      )
                      .join("")}
                </div>
                <button class="prev">&#10094;</button>
                <button class="next">&#10095;</button>
            </div>
            <div class="productdetails">
                <h2 class="titleproduct">${producto.title || producto.name}</h2>
                <p>${producto.description}</p>
                <p class="price">usd ${producto.price.toFixed(2)}</p>
                <button class="addtocart" data-producto="${
                  producto.title || producto.name
                }" data-precio="${producto.price}">
                    Agregar al Carrito
                </button>
            </div>
        `;

    contenedorProductos.appendChild(elementoProducto);
  });

  inicializarCarouseles();
  inicializarCarrito();
}

function inicializarCarouseles() {
  const carouseles = document.querySelectorAll(".carousel");

  carouseles.forEach((carousel) => {
    const imagenes = carousel.querySelectorAll(".carouselimages img");
    const anterior = carousel.querySelector(".prev");
    const siguiente = carousel.querySelector(".next");
    let indice = 0;
    const tiempoIntervalo = 3000;

    const actualizarCarousel = () => {
      imagenes.forEach((img) => {
        img.classList.remove("active");
      });

      imagenes[indice].classList.add("active");
    };

    anterior.addEventListener("click", () => {
      indice = indice === 0 ? imagenes.length - 1 : indice - 1;
      actualizarCarousel();
    });

    siguiente.addEventListener("click", () => {
      indice = indice === imagenes.length - 1 ? 0 : indice + 1;
      actualizarCarousel();
    });

    setInterval(() => {
      indice = indice === imagenes.length - 1 ? 0 : indice + 1;
      actualizarCarousel();
    }, tiempoIntervalo);

    actualizarCarousel();
  });
}

function inicializarCarrito() {
  let carrito = cargarCarritoDesdeLocalStorage();
  const itemsCarrito = document.getElementById("cartitems");
  const totalCarrito = document.getElementById("carttotal");
  const botonCarrito = document.getElementById("cartbutton");
  const botonVaciarCarrito = document.getElementById("emptycart");
  const botonCheckout = document.getElementById("checkout");
  const modalPago = document.getElementById("payment");
  const cerrarModal = document.querySelector(".closemodal");
  const botonCancelar = document.getElementById("cancelpayment");
  const botonEnviarPago = document.getElementById("submitpayment");
  const formularioPago = document.getElementById("paymentform");

  function limpiarFormulario() {
    formularioPago.reset();
  }

  botonCarrito.addEventListener("click", () => {
    const contenidoCarrito = document.getElementById("cartcontent");
    contenidoCarrito.style.display =
      contenidoCarrito.style.display === "none" ||
      contenidoCarrito.style.display === ""
        ? "block"
        : "none";
  });

  document.querySelectorAll(".addtocart").forEach((boton) => {
    boton.addEventListener("click", () => {
      const producto = boton.getAttribute("data-producto");
      const precio = parseFloat(boton.getAttribute("data-precio"));

      if (carrito[producto]) {
        carrito[producto].cantidad += 1;
        carrito[producto].total += precio;
      } else {
        carrito[producto] = { precio, cantidad: 1, total: precio };
      }
      actualizarCarrito();
      mostrarAlerta(`Producto agregado al carrito: ${producto}`);
    });
  });

  window.aumentarCantidad = (producto) => {
    if (carrito[producto]) {
      carrito[producto].cantidad += 1;
      carrito[producto].total += carrito[producto].precio;
      actualizarCarrito();
    }
  };

  window.disminuirCantidad = (producto) => {
    if (carrito[producto] && carrito[producto].cantidad > 1) {
      carrito[producto].cantidad -= 1;
      carrito[producto].total -= carrito[producto].precio;
      actualizarCarrito();
    }
  };

  botonVaciarCarrito.addEventListener("click", () => {
    Swal.fire({
      title: "¿Estás seguro?",
      text: "¡No podrás revertir esta acción!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, vaciar",
    }).then((result) => {
      if (result.isConfirmed) {
        carrito = {};
        actualizarCarrito();
        mostrarAlerta("Carrito vaciado");
      }
    });
  });

  function actualizarCarrito() {
    itemsCarrito.innerHTML = "";
    let total = 0;

    for (const producto in carrito) {
      const item = carrito[producto];
      const li = document.createElement("li");
      li.innerHTML = `
                ${producto}: $${item.precio.toFixed(2)} x ${item.cantidad}
                <button onclick="aumentarCantidad('${producto}')">+</button>
                <button onclick="disminuirCantidad('${producto}')">-</button>
            `;
      itemsCarrito.appendChild(li);
      total += item.total;
    }

    totalCarrito.textContent = total.toFixed(2);
    document.getElementById("cartcount").textContent = Object.keys(
      carrito
    ).reduce((suma, producto) => suma + carrito[producto].cantidad, 0);

    guardarCarritoEnLocalStorage();
  }

  function guardarCarritoEnLocalStorage() {
    localStorage.setItem("carrito", JSON.stringify(carrito));
  }

  function cargarCarritoDesdeLocalStorage() {
    const carritoGuardado = localStorage.getItem("carrito");
    return carritoGuardado ? JSON.parse(carritoGuardado) : {};
  }

  function mostrarAlerta(mensaje) {
    Swal.fire({
      text: mensaje,
      icon: "success",
      confirmButtonText: "OK",
    });
  }

  botonCheckout.addEventListener("click", () => {
    document.getElementById("cartcontent").style.display = "none";
    modalPago.style.display = "block";
  });

  botonCancelar.addEventListener("click", () => {
    modalPago.style.display = "none";
    limpiarFormulario();
  });

  window.addEventListener("click", (event) => {
    if (event.target === modalPago) {
      modalPago.style.display = "none";
      limpiarFormulario();
    }
  });

  cerrarModal.addEventListener("click", () => {
    modalPago.style.display = "none";
    limpiarFormulario();
  });

  botonEnviarPago.addEventListener("click", (event) => {
    event.preventDefault();
    Swal.fire({
      text: "¡Pago exitoso!",
      icon: "success",
      confirmButtonText: "OK",
    }).then(() => {
      modalPago.style.display = "none";
      carrito = {};
      actualizarCarrito();
      limpiarFormulario();
    });
  });

  actualizarCarrito();
}

cargarProductos();
